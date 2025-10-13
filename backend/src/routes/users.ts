import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticateToken, requireAdmin, requireEmployeeOrAdmin } from '../middlewares/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// User management routes (Admin only)
router.get('/', requireAdmin, userController.getAllUsers);
router.get('/stats', requireAdmin, userController.getUserStats);
router.get('/:id', requireAdmin, userController.getUserById);
router.put('/:id', requireAdmin, userController.updateUser);
router.delete('/:id', requireAdmin, userController.deleteUser);
router.post('/:id/restore', requireAdmin, userController.restoreUser);

// Employee-specific routes (Employee or Admin access)
router.get('/employees/available', requireEmployeeOrAdmin, userController.getAvailableEmployees);

export default router;
