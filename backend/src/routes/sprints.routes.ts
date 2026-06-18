import { Router } from 'express';
import { sprintController } from '../controllers/sprint.controller';
import { authenticateToken, requireAdmin, requireEmployeeOrAdmin, requireClientOrAdmin } from '../middlewares/auth';

const router = Router();

// All sprint routes require authentication
router.use(authenticateToken as any);

/**
 * Sprint Planning & Management Routes
 *
 * POST   /api/sprints/plan/:workflowId        → (Re-)plan sprints for a workflow (admin)
 * GET    /api/sprints/workflow/:workflowId     → List all sprints for a workflow
 * GET    /api/sprints/:id                      → Get single sprint with tasks
 * PATCH  /api/sprints/:id/status              → Advance sprint lifecycle (admin)
 * POST   /api/sprints/:id/replan              → End sprint & roll unfinished tasks forward (admin)
 *
 * NOTE: Specific routes (/plan/*, /workflow/*) must come BEFORE the /:id wildcard.
 */
router.post('/plan/:workflowId',    requireAdmin, sprintController.planSprints.bind(sprintController));
router.get('/workflow/:workflowId', requireClientOrAdmin, sprintController.getSprintsForWorkflow.bind(sprintController));
router.get('/:id',                  requireEmployeeOrAdmin, sprintController.getSprintById.bind(sprintController));
router.patch('/:id/status',         requireAdmin, sprintController.updateSprintStatus.bind(sprintController));
router.post('/:id/replan',          requireAdmin, sprintController.replanSprint.bind(sprintController));

export default router;
