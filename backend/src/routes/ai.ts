import { Router } from 'express';
import { aiController } from '../controllers/aiController';
import { authenticateToken } from '../middlewares/auth';
import { validateBody } from '../middlewares/validation';
import { z } from 'zod';

const router = Router();

// Demo endpoint without authentication for testing
router.post('/demo-workflow', async (req, res): Promise<void> => {
  try {
    const { description, requirements, timeline, budget } = req.body;
    
    if (!description) {
      res.status(400).json({ message: 'Description is required' });
      return;
    }

    // Import workflowService here to avoid circular dependencies
    const { workflowService } = await import('../services/workflow.service');
    
    // For demo purposes, use demo IDs
    const workflow = await workflowService.generateWorkflow(
      description, 
      'demo-product-id', 
      'demo-client-id'
    );

    res.json({ 
      success: true,
      workflow,
      message: 'Workflow generated successfully' 
    });
  } catch (error) {
    console.error('Error generating demo workflow:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to generate workflow',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Apply authentication to all other routes
router.use(authenticateToken);

const generateWorkflowSchema = z.object({
  description: z.string().min(10),
});

const assignTasksSchema = z.object({
  workflowId: z.string().optional(),
  taskIds: z.array(z.string()).optional(),
}).refine(data => data.workflowId || data.taskIds, {
  message: "Either workflowId or taskIds is required"
});

// AI service routes
router.post('/generate-workflow', validateBody(generateWorkflowSchema), aiController.generateWorkflow);
router.post('/assign-tasks', validateBody(assignTasksSchema), aiController.assignTasks);
router.post('/analyze-project', validateBody(generateWorkflowSchema), aiController.analyzeProject);
router.get('/recommendations/:productId', aiController.getRecommendations);

export default router;
