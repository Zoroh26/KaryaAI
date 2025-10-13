import { Router } from 'express';
import { authController } from '../controllers/authController';

const router = Router();

// Public routes
router.post('/signup', authController.signup.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/logout', authController.logout.bind(authController));

export default router;
