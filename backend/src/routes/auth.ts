import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Public routes
router.post('/signup', authController.signup.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/logout', authController.logout.bind(authController));

/**
 * Dev/test-only: issue a Firebase ID token equivalent via Admin SDK.
 * Uses createCustomToken from Admin SDK (server-side) so it works even when
 * the Identity Toolkit client REST API is restricted on the Firebase project.
 * The returned token is a Firebase custom token — middleware must handle it.
 *
 * Only enabled in non-production environments.
 */
if (process.env.NODE_ENV !== 'production') {
  router.post('/dev-token', authController.devToken.bind(authController));
}

// Protected utility route
router.get('/me', authenticateToken, (req: any, res) => {
  res.json({ success: true, data: { user: req.user } });
});

export default router;
