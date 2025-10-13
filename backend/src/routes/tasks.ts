import { Router } from 'express';
import { taskController } from '../controllers/taskController';
import { authenticateToken } from '../middlewares/auth';
import { validateBody } from '../middlewares/validation';
import { insertTaskSchema } from '../types/schema';
import { z } from 'zod';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

const assignTasksSchema = z.object({
  taskIds: z.array(z.string()),
});

// Task management routes
router.get('/', taskController.getTasks);
router.post('/', validateBody(insertTaskSchema), taskController.createTask);
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.post('/assign', validateBody(assignTasksSchema), taskController.assignTasks);
router.get('/employee/:employeeId', taskController.getEmployeeTasks);

export default router;
