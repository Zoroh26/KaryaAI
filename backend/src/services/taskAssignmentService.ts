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

      const assignments: AssignmentResult[] = [];

      for (const task of tasks) {
        if (task.status !== 'unassigned') {
          continue; // Skip already assigned tasks
        }

        const bestMatch = await this.findBestEmployeeForTask(task, availableEmployees);
        
        if (bestMatch) {
          // Update task with assignment
          await firebaseService.updateTask(task.id, {
            assignedTo: bestMatch.employee.id,
            status: 'assigned',
          });

          // Update employee availability if they reach capacity
          const employeeTasks = await firebaseService.getTasksByEmployee(bestMatch.employee.id);
          const activeTasksCount = employeeTasks.filter(t => 
            ['assigned', 'in_progress'].includes(t.status)
          ).length;

          // If employee has 3+ active tasks, mark as unavailable
          if (activeTasksCount >= 3) {
            await firebaseService.updateUser(bestMatch.employee.id, {
              isAvailable: false,
            });
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

  private async findBestEmployeeForTask(
    task: Task, 
    employees: User[]
  ): Promise<{
    employee: User;
    score: number;
    reason: string;
  } | null> {
    let bestMatch: { employee: User; score: number; reason: string } | null = null;

    for (const employee of employees) {
      if (!employee.skillset || !employee.isAvailable) {
        continue;
      }

      const score = await this.calculateMatchScore(task, employee);
      const reason = this.generateMatchReason(task, employee, score);

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { employee, score, reason };
      }
    }

    return bestMatch;
  }

  private async calculateMatchScore(task: Task, employee: User): Promise<number> {
    let score = 0;

    // Skill matching (40% of score)
    const skillMatches = task.skillRequired.filter(skill => 
      employee.skillset?.some(empSkill => 
        empSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(empSkill.toLowerCase())
      )
    ).length;
    
    const skillScore = (skillMatches / task.skillRequired.length) * 40;
    score += skillScore;

    // Workload consideration (30% of score)
    const employeeTasks = await firebaseService.getTasksByEmployee(employee.id);
    const activeTasksCount = employeeTasks.filter(t => 
      ['assigned', 'in_progress'].includes(t.status)
    ).length;

    const workloadScore = Math.max(0, (3 - activeTasksCount) / 3) * 30;
    score += workloadScore;

    // Priority consideration (20% of score)
    const priorityScore = task.priority === 'High' ? 20 : 
                         task.priority === 'Medium' ? 15 : 10;
    score += priorityScore;

    // Experience boost (10% of score) - employees with more skills get slight preference
    const experienceScore = Math.min((employee.skillset?.length || 0) / 10, 1) * 10;
    score += experienceScore;

    return Math.round(score);
  }

  private generateMatchReason(task: Task, employee: User, score: number): string {
    const skillMatches = task.skillRequired.filter(skill => 
      employee.skillset?.some(empSkill => 
        empSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );

    if (score >= 80) {
      return `Excellent match: ${skillMatches.length}/${task.skillRequired.length} skills matched, low workload`;
    } else if (score >= 60) {
      return `Good match: ${skillMatches.length}/${task.skillRequired.length} skills matched`;
    } else if (score >= 40) {
      return `Fair match: Some relevant skills, available capacity`;
    } else {
      return `Basic match: Available employee with transferable skills`;
    }
  }
}

export const taskAssignmentService = new TaskAssignmentService();
