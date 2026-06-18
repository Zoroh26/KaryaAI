import { Request, Response } from 'express';
import { sprintService } from '../services/sprint.service';
import { firebaseService } from '../services/firebaseService';
import { SprintStatus } from '../models/sprint.model';

const VALID_STATUSES: SprintStatus[] = ['planning', 'active', 'completed', 'cancelled'];

export class SprintController {
  /**
   * POST /api/sprints/plan/:workflowId
   * (Re-)plan sprints for a workflow. Deletes existing sprints and re-builds from scratch.
   * Triggered automatically on workflow approval; can also be called manually by admins.
   */
  async planSprints(req: Request, res: Response): Promise<void> {
    try {
      const { workflowId } = req.params;
      const { sprintStartDate, sprintDurationWorkingDays, employeeCapacityPoints } = req.body;

      const result = await sprintService.planSprintsForWorkflow(workflowId, {
        sprintStartDate:           sprintStartDate ? new Date(sprintStartDate) : undefined,
        sprintDurationWorkingDays: sprintDurationWorkingDays,
        employeeCapacityPoints:    employeeCapacityPoints,
      });

      res.status(201).json({
        success: true,
        data:    result,
        message: `Sprints planned: ${result.sprintsCreated} sprint(s) covering ${result.tasksPlanned} task(s)`,
      });
    } catch (error: any) {
      console.error('SprintController.planSprints error:', error);
      res.status(500).json({ success: false, error: error.message ?? 'Failed to plan sprints' });
    }
  }

  /**
   * GET /api/sprints/workflow/:workflowId
   * List all sprints for a given workflow, ordered by sprint number.
   */
  async getSprintsForWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { workflowId } = req.params;
      const sprints = await sprintService.getSprintsByWorkflow(workflowId);
      res.json({ success: true, data: sprints, count: sprints.length });
    } catch (error: any) {
      console.error('SprintController.getSprintsForWorkflow error:', error);
      res.status(500).json({ success: false, error: error.message ?? 'Failed to fetch sprints' });
    }
  }

  /**
   * GET /api/sprints/:id
   * Get a single sprint with its tasks enriched.
   */
  async getSprintById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const sprint = await sprintService.getSprintById(id);

      // Enrich: fetch the actual task documents for this sprint
      const tasks = await firebaseService.getTasks({ sprintId: sprint.id });

      res.json({
        success: true,
        data: {
          ...sprint,
          tasks,
          // handy summary
          taskSummary: {
            total:      tasks.length,
            assigned:   tasks.filter(t => t.status === 'assigned').length,
            inProgress: tasks.filter(t => t.status === 'in_progress').length,
            completed:  tasks.filter(t => t.status === 'completed').length,
            cancelled:  tasks.filter(t => t.status === 'cancelled').length,
          },
        },
      });
    } catch (error: any) {
      console.error('SprintController.getSprintById error:', error);
      const status = error.message === 'Sprint not found' ? 404 : 500;
      res.status(status).json({ success: false, error: error.message ?? 'Failed to fetch sprint' });
    }
  }

  /**
   * PATCH /api/sprints/:id/status
   * Advance a sprint through its lifecycle: planning → active → completed | cancelled
   */
  async updateSprintStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id }     = req.params;
      const { status } = req.body;

      if (!status || !VALID_STATUSES.includes(status)) {
        res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        });
        return;
      }

      const sprint = await sprintService.updateSprintStatus(id, status as SprintStatus);
      res.json({
        success: true,
        data:    sprint,
        message: `Sprint '${sprint.name}' status updated to '${status}'`,
      });
    } catch (error: any) {
      console.error('SprintController.updateSprintStatus error:', error);
      const code = error.message?.includes('Cannot transition') ? 400 : 500;
      res.status(code).json({ success: false, error: error.message ?? 'Failed to update sprint' });
    }
  }

  /**
   * POST /api/sprints/:id/replan
   * End an active sprint: move incomplete tasks to a new next sprint.
   */
  async replanSprint(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await sprintService.replanSprint(id);
      res.json({
        success: true,
        data:    result,
        message: `${result.movedTasks} incomplete task(s) moved to Sprint ${result.nextSprintNumber}`,
      });
    } catch (error: any) {
      console.error('SprintController.replanSprint error:', error);
      const code = error.message?.includes('Only active') ? 400 : 500;
      res.status(code).json({ success: false, error: error.message ?? 'Failed to replan sprint' });
    }
  }
}

export const sprintController = new SprintController();
