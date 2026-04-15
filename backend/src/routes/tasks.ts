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

// Task management routes — order matters: specific paths before parameterized ones
router.get('/', taskController.getTasks);
router.post('/', validateBody(insertTaskSchema), taskController.createTask);
router.post('/assign', validateBody(assignTasksSchema), taskController.assignTasks);
router.get('/employee/:employeeId', taskController.getEmployeeTasks); // MUST be before /:id
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);

export default router;
