import { Request, Response } from 'express';
import { firebaseService } from '../services/firebaseService';
import { taskAssignmentService } from '../services/taskAssignmentService';
import { InsertTask } from '../types/schema';
import { createError } from '../middlewares/errorHandler';

export class TaskController {
  async createTask(req: Request, res: Response) {
    try {
      const taskData: InsertTask = req.body;
      
      const task = await firebaseService.createTask({
        ...taskData,
        status: 'unassigned',
      });

      res.status(201).json({
        message: 'Task created successfully',
        task,
      });
    } catch (error) {
      console.error('Create task error:', error);
      throw createError('Failed to create task', 500);
    }
  }

  async getTasks(req: Request, res: Response) {
    try {
      const { status, assignedTo, workflowId, productId } = req.query;
      const userRole = (req as any).user?.role;
      const userId = (req as any).user?.uid;

      let filters: any = {};
      
      if (status) filters.status = status;
      if (workflowId) filters.workflowId = workflowId;
      if (productId) filters.productId = productId;

      // If user is an employee, only show their assigned tasks unless admin
      if (userRole === 'employee' && !assignedTo) {
        filters.assignedTo = userId;
      } else if (assignedTo) {
        filters.assignedTo = assignedTo;
      }

      const tasks = await firebaseService.getTasks(filters);

      res.json({ tasks });
    } catch (error) {
      console.error('Get tasks error:', error);
      throw createError('Failed to fetch tasks', 500);
    }
  }

  async getTaskById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const task = await firebaseService.getTask(id);
      
      if (!task) {
        throw createError('Task not found', 404);
      }

      const userRole = (req as any).user?.role;
      const userId = (req as any).user?.uid;

      // Check access permissions
      if (userRole === 'employee' && task.assignedTo !== userId) {
        throw createError('Access denied', 403);
      }

      res.json({ task });
    } catch (error) {
      console.error('Get task by ID error:', error);
      throw error;
    }
  }

  async updateTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const existingTask = await firebaseService.getTask(id);
      if (!existingTask) {
        throw createError('Task not found', 404);
      }

      const userRole = (req as any).user?.role;
      const userId = (req as any).user?.uid;

      // Check permissions - employees can only update their own tasks
      if (userRole === 'employee' && existingTask.assignedTo !== userId) {
        throw createError('Access denied', 403);
      }

      await firebaseService.updateTask(id, updates);
      
      // Check if all tasks in workflow are completed
      if (updates.status === 'completed') {
        await this.checkWorkflowCompletion(existingTask.workflowId);
      }

      const updatedTask = await firebaseService.getTask(id);

      res.json({
        message: 'Task updated successfully',
        task: updatedTask,
      });
    } catch (error) {
      console.error('Update task error:', error);
      throw error;
    }
  }

  async assignTasks(req: Request, res: Response) {
    try {
      const { taskIds } = req.body;
      
      if (!Array.isArray(taskIds) || taskIds.length === 0) {
        throw createError('Task IDs required', 400);
      }

      // Get tasks to assign
      const tasks = [];
      for (const taskId of taskIds) {
        const task = await firebaseService.getTask(taskId);
        if (task) {
          tasks.push(task);
        }
      }

      if (tasks.length === 0) {
        throw createError('No valid tasks found', 404);
      }

      const assignments = await taskAssignmentService.assignTasksToEmployees(tasks);

      res.json({
        message: 'Tasks assigned successfully',
        assignments,
      });
    } catch (error) {
      console.error('Assign tasks error:', error);
      throw error;
    }
  }

  async getEmployeeTasks(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const userRole = (req as any).user?.role;
      const userId = (req as any).user?.uid;

      // Employees can only see their own tasks, admins can see any
      if (userRole === 'employee' && employeeId !== userId) {
        throw createError('Access denied', 403);
      }

      const tasks = await firebaseService.getTasksByEmployee(employeeId);

      res.json({ tasks });
    } catch (error) {
      console.error('Get employee tasks error:', error);
      throw error;
    }
  }

  private async checkWorkflowCompletion(workflowId: string) {
    try {
      const tasks = await firebaseService.getTasks({ workflowId });
      const allCompleted = tasks.every(task => task.status === 'completed');
      
      if (allCompleted) {
        // Update workflow status
        await firebaseService.updateWorkflow(workflowId, {
          status: 'approved', // or 'completed' if you have that status
        });

        // Get workflow to update product
        const workflow = await firebaseService.getWorkflow(workflowId);
        if (workflow) {
          await firebaseService.updateProduct(workflow.productId, {
            status: 'completed',
          });
        }
      }
    } catch (error) {
      console.error('Error checking workflow completion:', error);
      // Don't throw error here as it's a side effect
    }
  }
}

export const taskController = new TaskController();
