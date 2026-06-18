import { Router } from 'express';
import { taskController } from '../controllers/taskController';
import { authenticateToken, requireAdmin, requireEmployeeOrAdmin } from '../middlewares/auth';
import { validateBody } from '../middlewares/validation';
import { insertTaskSchema } from '../types/schema';
import { z } from 'zod';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

const assignTasksSchema = z.object({
  taskIds: z.array(z.string()),
  preview: z.boolean().optional().default(false),
});

// Task management routes — order matters: specific paths before parameterized ones
router.get('/', requireAdmin, taskController.getTasks);
router.post('/', requireAdmin, validateBody(insertTaskSchema), taskController.createTask);
router.post('/assign', requireAdmin, validateBody(assignTasksSchema), taskController.assignTasks);
router.get('/employee/:employeeId', requireEmployeeOrAdmin, taskController.getEmployeeTasks); // MUST be before /:id
router.get('/:id', requireEmployeeOrAdmin, taskController.getTaskById);
router.put('/:id', requireEmployeeOrAdmin, taskController.updateTask);

export default router;
