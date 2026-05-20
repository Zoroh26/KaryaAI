import { Router } from 'express';
import { aiController } from '../controllers/aiController';
import { authenticateToken, requireAdmin, requireClientOrAdmin } from '../middlewares/auth';
import { validateBody } from '../middlewares/validation';
import { z } from 'zod';

const router = Router();

// ─── Public demo endpoint (no auth) ──────────────────────────────────────────

router.post('/demo-workflow', async (req, res): Promise<void> => {
  try {
    const { description } = req.body;

    if (!description || typeof description !== 'string' || description.length < 10) {
      res.status(400).json({ success: false, message: 'Description is required (min 10 characters)' });
      return;
    }

    const { workflowService } = await import('../services/workflow.service');
    const workflow = await workflowService.generateWorkflow(description, 'demo-product-id', 'demo-client-id');

    res.json({ success: true, workflow, message: 'Workflow generated successfully' });
  } catch (error) {
    console.error('Error generating demo workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate workflow',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ─── Apply authentication to all routes below ────────────────────────────────

router.use(authenticateToken);

// Zod schemas

const generateWorkflowSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters'),
  productId: z.string().min(1, 'Product ID is required'),
  clientId: z.string().min(1, 'Client ID is required'),
});

const assignTasksSchema = z.object({
  workflowId: z.string().optional(),
  taskIds: z.array(z.string()).optional(),
  preview: z.boolean().optional().default(false),
}).refine(data => data.workflowId || (data.taskIds && data.taskIds.length > 0), {
  message: 'Either workflowId or taskIds (non-empty) is required',
});

const analyzeProjectSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

// ─── AI routes ────────────────────────────────────────────────────────────────

router.post('/generate-workflow', requireClientOrAdmin, validateBody(generateWorkflowSchema), aiController.generateWorkflow.bind(aiController));
router.post('/assign-tasks', requireAdmin, validateBody(assignTasksSchema), aiController.assignTasks.bind(aiController));
router.post('/analyze-project', requireClientOrAdmin, validateBody(analyzeProjectSchema), aiController.analyzeProject.bind(aiController));
router.get('/recommendations/:productId', requireClientOrAdmin, aiController.getRecommendations.bind(aiController));

export default router;
