import { Router } from 'express';
import { workflowController } from '../controllers/workflow.controller';
import { authenticateToken } from '../middlewares/auth';
import { requireAdmin, requireClient, requireClientOrAdmin } from '../middlewares/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Client routes - clients can generate workflows for their products
router.post('/generate', requireClient, workflowController.generateWorkflow);
router.post('/analyze', requireClientOrAdmin, workflowController.analyzeProject);
router.get('/my-workflows', requireClient, workflowController.getWorkflows); // Client can see their own workflows

// Admin routes - admins manage workflows
router.get('/', requireAdmin, workflowController.getWorkflows);
router.post('/:id/approve', requireAdmin, workflowController.approveWorkflow);

// Client or Admin routes - both can view and update workflows
router.get('/:id', requireClientOrAdmin, workflowController.getWorkflowById);
router.put('/:id', requireClientOrAdmin, workflowController.updateWorkflow);

export default router;
