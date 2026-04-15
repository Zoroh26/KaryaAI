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
  async assignTasksToEmployees(tasks: Task[]): Promise<AssignmentResult[]> {
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

        if (bestMatch) {
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

      const score = this.calculateMatchScore(task, employee, taskCountMap);
      const reason = this.generateMatchReason(task, employee, score);

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
  ): number {
    let score = 0;

    // Skill matching (40% of score)
    const skillMatches = task.skillsRequired.filter(skill =>
      employee.skillset?.some(empSkill =>
        empSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(empSkill.toLowerCase())
      )
    ).length;

    const skillScore = task.skillsRequired.length > 0
      ? (skillMatches / task.skillsRequired.length) * 40
      : 0;
    score += skillScore;

    // Workload consideration (30% of score) — uses pre-fetched count
    const activeTasksCount = taskCountMap.get(employee.id) ?? 0;
    const workloadScore = Math.max(0, (3 - activeTasksCount) / 3) * 30;
    score += workloadScore;

    // Priority consideration (20% of score)
    const priorityScore = task.priority === 'High' ? 20 :
                         task.priority === 'Medium' ? 15 : 10;
    score += priorityScore;

    // Experience boost (10% of score)
    const experienceScore = Math.min((employee.skillset?.length || 0) / 10, 1) * 10;
    score += experienceScore;

    return Math.round(score);
  }

  private generateMatchReason(task: Task, employee: User, score: number): string {
    const skillMatches = task.skillsRequired.filter(skill =>
      employee.skillset?.some(empSkill =>
        empSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );

    if (score >= 80) {
      return `Excellent match: ${skillMatches.length}/${task.skillsRequired.length} skills matched, low workload`;
    } else if (score >= 60) {
      return `Good match: ${skillMatches.length}/${task.skillsRequired.length} skills matched`;
    } else if (score >= 40) {
      return `Fair match: Some relevant skills, available capacity`;
    } else {
      return `Basic match: Available employee with transferable skills`;
    }
  }
}

export const taskAssignmentService = new TaskAssignmentService();
