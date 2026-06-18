import { User, Task } from '../types/schema';
import { firebaseService } from './firebaseService';

export interface AssignmentResult {
  taskId: string;
  assignedTo: string;
  employeeName: string;
  matchScore: number;
  reason: string;
}

export class TaskAssignmentService {
  async assignTasksToEmployees(tasks: Task[], commit: boolean = true): Promise<AssignmentResult[]> {
    try {
      const availableEmployees = await firebaseService.getAvailableEmployees();

      if (availableEmployees.length === 0) {
        throw new Error('No available employees found');
      }

      // Pre-fetch active task counts for ALL employees in parallel — avoids N+1 per scoring call
      const employeeTaskCountMap = new Map<string, number>();
      const tasksByEmployee = await Promise.all(
        availableEmployees.map(e => firebaseService.getTasksByEmployee(e.id))
      );
      availableEmployees.forEach((e, idx) => {
        const activeTasks = tasksByEmployee[idx].filter(t =>
          ['assigned', 'in_progress'].includes(t.status)
        );
        employeeTaskCountMap.set(e.id, activeTasks.length);
      });

      const assignments: AssignmentResult[] = [];

      for (const task of tasks) {
        if (task.status !== 'unassigned') {
          continue; // Skip already assigned tasks
        }

        const bestMatch = this.findBestEmployeeForTask(task, availableEmployees, employeeTaskCountMap);

        if (bestMatch && bestMatch.score > 0) {
          if (commit) {
            // Update task with assignment
            await firebaseService.updateTask(task.id, {
              assignedTo: bestMatch.employee.id,
              status: 'assigned',
            });

            // Increment the in-memory count so subsequent tasks in this run see the updated workload
            const current = employeeTaskCountMap.get(bestMatch.employee.id) ?? 0;
            const newCount = current + 1;
            employeeTaskCountMap.set(bestMatch.employee.id, newCount);

            // If employee has reached 3 active tasks, mark unavailable
            if (newCount >= 3) {
              await firebaseService.updateUser(bestMatch.employee.id, { isAvailable: false });
              // Remove from future scoring by filtering them out
              const idx = availableEmployees.findIndex(e => e.id === bestMatch.employee.id);
              if (idx !== -1) availableEmployees.splice(idx, 1);
            }
          } else {
            // For simulation, increment the virtual count but don't hit DB
            const current = employeeTaskCountMap.get(bestMatch.employee.id) ?? 0;
            employeeTaskCountMap.set(bestMatch.employee.id, current + 1);
          }

          assignments.push({
            taskId: task.id,
            assignedTo: bestMatch.employee.id,
            employeeName: bestMatch.employee.full_name,
            matchScore: bestMatch.score,
            reason: bestMatch.reason,
          });
        }
      }

      return assignments;
    } catch (error) {
      console.error('Task assignment error:', error);
      throw new Error(`Failed to assign tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Pure, synchronous scoring — uses pre-fetched workload counts (no DB calls)
   */
  private findBestEmployeeForTask(
    task: Task,
    employees: User[],
    taskCountMap: Map<string, number>
  ): { employee: User; score: number; reason: string } | null {
    let bestMatch: { employee: User; score: number; reason: string } | null = null;

    for (const employee of employees) {
      if (!employee.skillset || !employee.isAvailable) {
        continue;
      }

      const { score, breakdown } = this.calculateMatchScore(task, employee, taskCountMap);
      const reason = this.generateMatchReason(task, employee, score, breakdown);

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { employee, score, reason };
      }
    }

    return bestMatch;
  }

  /**
   * Synchronous score — uses the pre-fetched taskCountMap, zero Firestore reads
   */
  private calculateMatchScore(
    task: Task,
    employee: User,
    taskCountMap: Map<string, number>
  ): { score: number; breakdown: any } {
    let score = 0;
    const breakdown: any = {};

    // 1. Skill matching (60% of score) - PRIMARY GATEKEEPER
    const skillMatches = task.skillsRequired.filter(skill => {
      const taskSkill = skill.toLowerCase().trim();
      if (!taskSkill) return false;
      
      return employee.skillset?.some(empSkill => {
        const eSkill = empSkill.toLowerCase().trim();
        if (eSkill.length < 2) return false;
        
        if (eSkill === taskSkill) return true;

        // Check word boundaries to avoid partial word matches (e.g., "sign" matching "design")
        const tWords = taskSkill.split(/[\s\-_,]+/);
        const eWords = eSkill.split(/[\s\-_,]+/);
        
        for (const ew of eWords) {
          if (ew.length >= 2 && tWords.includes(ew)) return true;
        }

        // Also allow if the entire string is a distinct phrase within the other
        const tPadded = ` ${taskSkill} `;
        const ePadded = ` ${eSkill} `;
        
        if (tPadded.includes(` ${eSkill} `)) return true;
        if (ePadded.includes(` ${taskSkill} `)) return true;

        return false;
      });
    }).length;

    // RULE: If task requires skills and employee has 0 matches, score is 0
    if (task.skillsRequired.length > 0 && skillMatches === 0) {
      return { score: 0, breakdown: { skill: 0, workload: 0, priority: 0, experience: 0 } };
    }

    const skillScore = task.skillsRequired.length > 0
      ? (skillMatches / task.skillsRequired.length) * 60
      : 60; // 60 if no skills required (general task)
    score += skillScore;
    breakdown.skill = Math.round(skillScore);

    // 2. Workload consideration (20% of score)
    const activeTasksCount = taskCountMap.get(employee.id) ?? 0;
    const workloadScore = Math.max(0, (3 - activeTasksCount) / 3) * 20;
    score += workloadScore;
    breakdown.workload = Math.round(workloadScore);

    // 3. Priority consideration (15% of score)
    const priorityScore = task.priority === 'High' ? 15 :
                         task.priority === 'Medium' ? 10 : 5;
    score += priorityScore;
    breakdown.priority = priorityScore;

    // 4. Experience boost (5% of score)
    const experienceScore = Math.min((employee.skillset?.length || 0) / 10, 1) * 5;
    score += experienceScore;
    breakdown.experience = Math.round(experienceScore);

    return { score: Math.round(score), breakdown };
  }

  private generateMatchReason(task: Task, employee: User, score: number, breakdown: any): string {
    if (score === 0) {
      return "No matching skills for required task specialized fields.";
    }

    const details = `(Skill: ${breakdown.skill}/60, Load: ${breakdown.workload}/20, Exp: ${breakdown.experience}/5)`;
    
    if (score >= 80) {
      return `Excellent match: High skill overlap & capacity. ${details}`;
    } else if (score >= 60) {
      return `Good match: Qualified with reasonable workload. ${details}`;
    } else if (score >= 30) {
      return `Fair match: Basic capability or transferable skills. ${details}`;
    } else {
      return `Low match: Only assigned as fallback. ${details}`;
    }
  }
}

export const taskAssignmentService = new TaskAssignmentService();
