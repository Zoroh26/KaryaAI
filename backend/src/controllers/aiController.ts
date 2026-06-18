import { Request, Response } from 'express';
import { workflowService } from '../services/workflow.service';
import { taskAssignmentService } from '../services/taskAssignmentService';
import { firebaseService } from '../services/firebaseService';
import { createError } from '../middlewares/errorHandler';

export class AIController {
  /**
   * Generate a workflow using AI.
   * Previously called analyzeProjectComplexity as a second Gemini round-trip;
   * that is removed — callers can use /analyze-project separately if needed.
   */
  async generateWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { description, productId, clientId } = req.body;

      if (!description || typeof description !== 'string') {
        res.status(400).json({ success: false, error: 'Project description is required' });
        return;
      }
      if (!productId || typeof productId !== 'string') {
        res.status(400).json({ success: false, error: 'Product ID is required' });
        return;
      }
      if (!clientId || typeof clientId !== 'string') {
        res.status(400).json({ success: false, error: 'Client ID is required' });
        return;
      }

      const workflow = await workflowService.generateWorkflow(description, productId, clientId);

      res.json({
        success: true,
        workflow,
        message: 'Workflow generated successfully',
      });
    } catch (error) {
      console.error('AI generate workflow error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate workflow with AI',
      });
    }
  }

  async assignTasks(req: Request, res: Response): Promise<void> {
    try {
      const { workflowId, taskIds, preview } = req.body;

      let tasks = [];

      if (workflowId) {
        // Get all unassigned tasks from the flat tasks collection for this workflow
        tasks = await firebaseService.getTasks({
          workflowId,
          status: 'unassigned',
        });
      } else if (taskIds && Array.isArray(taskIds)) {
        for (const taskId of taskIds) {
          const task = await firebaseService.getTask(taskId);
          if (task && task.status === 'unassigned') {
            tasks.push(task);
          }
        }
      } else {
        res.status(400).json({ success: false, error: 'Either workflowId or taskIds is required' });
        return;
      }

      if (tasks.length === 0) {
        res.status(404).json({ success: false, error: 'No unassigned tasks found' });
        return;
      }

      const assignments = await taskAssignmentService.assignTasksToEmployees(tasks, !preview);

      res.json({
        success: true,
        message: preview ? 'Task assignment preview generated' : 'Tasks assigned successfully using AI',
        assignments,
        totalAssigned: assignments.length,
        isPreview: !!preview
      });
    } catch (error) {
      console.error('AI assign tasks error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign tasks',
      });
    }
  }

  async analyzeProject(req: Request, res: Response): Promise<void> {
    try {
      const { description } = req.body;

      if (!description || typeof description !== 'string') {
        res.status(400).json({ success: false, error: 'Project description is required' });
        return;
      }

      const analysis = await workflowService.analyzeProjectComplexity(description);

      res.json({
        success: true,
        analysis,
        message: 'Project analysis completed',
      });
    } catch (error) {
      console.error('AI analyze project error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze project',
      });
    }
  }

  async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;

      const product = await firebaseService.getProduct(productId);
      if (!product) {
        res.status(404).json({ success: false, error: 'Product not found' });
        return;
      }

      const analysis = await workflowService.analyzeProjectComplexity(product.description);
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
        success: true,
        recommendations,
        message: 'Recommendations generated successfully',
      });
    } catch (error) {
      console.error('AI recommendations error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate recommendations',
      });
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
