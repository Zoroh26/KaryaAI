import { Request, Response } from 'express';
import { workflowService } from '../services/workflow.service';
import { taskAssignmentService } from '../services/taskAssignmentService';
import { firebaseService } from '../services/firebaseService';
import { createError } from '../middlewares/errorHandler';

export class AIController {
  async generateWorkflow(req: Request, res: Response) {
    try {
      const { description, productId, clientId } = req.body;
      
      if (!description || typeof description !== 'string') {
        throw createError('Project description is required', 400);
      }

      if (!productId || !clientId) {
        throw createError('Product ID and Client ID are required', 400);
      }

      const workflow = await workflowService.generateWorkflow(description, productId, clientId);
      const analysis = await workflowService.analyzeProjectComplexity(description);

      res.json({
        workflow,
        analysis,
        message: 'Workflow generated successfully',
      });
    } catch (error) {
      console.error('AI generate workflow error:', error);
      throw createError('Failed to generate workflow with AI', 500);
    }
  }

  async assignTasks(req: Request, res: Response) {
    try {
      const { workflowId, taskIds } = req.body;

      let tasks = [];

      if (workflowId) {
        // Get all unassigned tasks from workflow
        tasks = await firebaseService.getTasks({ 
          workflowId, 
          status: 'unassigned' 
        });
      } else if (taskIds && Array.isArray(taskIds)) {
        // Get specific tasks
        for (const taskId of taskIds) {
          const task = await firebaseService.getTask(taskId);
          if (task && task.status === 'unassigned') {
            tasks.push(task);
          }
        }
      } else {
        throw createError('Either workflowId or taskIds is required', 400);
      }

      if (tasks.length === 0) {
        throw createError('No unassigned tasks found', 404);
      }

      const assignments = await taskAssignmentService.assignTasksToEmployees(tasks);

      res.json({
        message: 'Tasks assigned successfully using AI',
        assignments,
        totalAssigned: assignments.length,
      });
    } catch (error) {
      console.error('AI assign tasks error:', error);
      throw error;
    }
  }

  async analyzeProject(req: Request, res: Response) {
    try {
      const { description } = req.body;
      
      if (!description || typeof description !== 'string') {
        throw createError('Project description is required', 400);
      }

      const analysis = await workflowService.analyzeProjectComplexity(description);

      res.json({
        analysis,
        message: 'Project analysis completed',
      });
    } catch (error) {
      console.error('AI analyze project error:', error);
      throw createError('Failed to analyze project with AI', 500);
    }
  }

  async getRecommendations(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      
      const product = await firebaseService.getProduct(productId);
      if (!product) {
        throw createError('Product not found', 404);
      }

      // Get project analysis
      const analysis = await workflowService.analyzeProjectComplexity(product.description);
      
      // Get current tasks and their status
      const tasks = await firebaseService.getTasks({ productId });
      const workflows = await firebaseService.getWorkflows({ productId });

      const recommendations = {
        projectAnalysis: analysis,
        currentStatus: {
          totalTasks: tasks.length,
          completedTasks: tasks.filter(t => t.status === 'completed').length,
          inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
          unassignedTasks: tasks.filter(t => t.status === 'unassigned').length,
        },
        workflowCount: workflows.length,
        suggestions: this.generateSuggestions(product, tasks, analysis),
      };

      res.json({
        recommendations,
        message: 'Recommendations generated successfully',
      });
    } catch (error) {
      console.error('AI recommendations error:', error);
      throw error;
    }
  }

  private generateSuggestions(product: any, tasks: any[], analysis: any) {
    const suggestions = [];

    if (tasks.filter(t => t.status === 'unassigned').length > 0) {
      suggestions.push({
        type: 'task_assignment',
        message: 'You have unassigned tasks. Consider using AI auto-assignment.',
        priority: 'High',
      });
    }

    if (analysis.complexity === 'High' && tasks.length < 10) {
      suggestions.push({
        type: 'workflow_expansion',
        message: 'Complex project detected. Consider breaking down into more detailed tasks.',
        priority: 'Medium',
      });
    }

    if (product.status === 'pending_review') {
      suggestions.push({
        type: 'workflow_generation',
        message: 'Project is pending review. Generate a workflow to start planning.',
        priority: 'High',
      });
    }

    return suggestions;
  }
}

export const aiController = new AIController();
