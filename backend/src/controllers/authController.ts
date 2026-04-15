import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { authService, SignupData, LoginData } from '../services/auth.service';
import { auth, firestore } from '../config/firebase';


export class AuthController {
  /**
   * User signup
   */
  async signup(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const signupData: SignupData = req.body;

      // Validate input data
      authService.validateSignupData(signupData);

      // Create user
      const result = await authService.createUser(signupData);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: result.user,
      });

    } catch (error: any) {
      console.error('AuthController.signup error:', error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/email-already-exists') {
        res.status(409).json({
          success: false,
          error: 'Email already exists',
          code: 'EMAIL_EXISTS'
        });
        return;
      }
      
      if (error.code === 'auth/invalid-email') {
        res.status(400).json({
          success: false,
          error: 'Invalid email format',
          code: 'INVALID_EMAIL'
        });
        return;
      }
      
      if (error.code === 'auth/weak-password') {
        res.status(400).json({
          success: false,
          error: 'Password is too weak',
          code: 'WEAK_PASSWORD'
        });
        return;
      }

      // Handle validation errors
      if (error.message.includes('Missing required fields') || 
          error.message.includes('Invalid email format') ||
          error.message.includes('Password must be') ||
          error.message.includes('Invalid role')) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR'
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to create user',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * User login
   */
  async login(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const loginData: LoginData = req.body;

      console.log('🔑 Login attempt for:', loginData.email);

      // Validate input data
      authService.validateLoginData(loginData);

      // Authenticate user
      const { token, user } = await authService.authenticateUser(loginData);

      // Set secure HTTP-only cookies
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      };

      // Set authentication token cookie
      res.cookie('auth_token', token, cookieOptions);
      
      // Set user info cookie (not HTTP-only so frontend can read it)
      res.cookie('user_info', JSON.stringify({
        uid: user.uid,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        skillset: user.skillset,
        isAvailable: user.isAvailable,
      }), {
        ...cookieOptions,
        httpOnly: false,
      });

      console.log('✅ Login successful for:', loginData.email, 'Role:', user.role);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,   // custom token — client should exchange for ID token via Firebase REST API
          user: {
            uid: user.uid,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            skillset: user.skillset,
            isAvailable: user.isAvailable,
          }
        }
      });

    } catch (error: any) {
      console.error('AuthController.login error:', error);

      // Handle validation errors
      if (error.message.includes('Email and password are required')) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      // Handle authentication errors
      if (error.message.includes('Invalid credentials') || 
          error.message.includes('User profile not found')) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Login failed',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * User logout
   */
  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🚪 Logout request initiated');

      // Clear authentication cookies
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
      };

      res.clearCookie('auth_token', cookieOptions);
      res.clearCookie('user_info', { ...cookieOptions, httpOnly: false });

      // Revoke Firebase tokens if user is authenticated
      if (req.user) {
        await authService.revokeUserTokens(req.user.uid);
        console.log('✅ Logout successful for user:', req.user.email);
      }

      console.log('🍪 Authentication cookies cleared');

      res.json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error: any) {
      console.error('AuthController.logout error:', error);
      
      // Even if logout has errors, we should clear cookies and respond successfully
      res.clearCookie('auth_token');
      res.clearCookie('user_info');
      
      res.json({
        success: true,
        message: 'Logout completed (with warnings)',
        warning: 'Some cleanup operations failed but user is logged out'
      });
    }
  }
  /**
   * DEV-ONLY: Issue a dev token for API testing.
   * Verifies that the email exists in Firebase Auth, then returns a signed
   * custom token from the Admin SDK (bypasses blocked client REST API).
   *
   * The test script must set Authorization: Bearer <customToken> AND the
   * auth middleware is updated to verify custom tokens via Admin SDK in dev.
   *
   * Only active in NODE_ENV !== 'production'.
   */
  async devToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'production') {
        res.status(403).json({ success: false, error: 'Not available in production' });
        return;
      }

      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, error: 'email and password are required' });
        return;
      }

      if (!auth || !firestore) {
        res.status(500).json({ success: false, error: 'Firebase not initialized' });
        return;
      }

      // Look up the user by email
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(email);
      } catch (err: any) {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
        return;
      }

      // Get user data from Firestore
      const userDoc = await firestore.collection('users').doc(userRecord.uid).get();
      if (!userDoc.exists) {
        res.status(401).json({ success: false, error: 'User profile not found' });
        return;
      }

      const userData = userDoc.data() as any;

      // Mint a custom token via Admin SDK — works without client REST API access
      const customToken = await auth.createCustomToken(userRecord.uid, {
        role: userData.role,
        email: userData.email,
        devMode: true,  // flag so middleware knows to handle it specially
      });

      res.json({
        success: true,
        data: {
          customToken,
          uid: userRecord.uid,
          role: userData.role,
          email: userData.email,
          full_name: userData.full_name,
        },
        message: 'Dev token issued. Exchange via Firebase client SDK or use X-Dev-Token header.',
      });

    } catch (error: any) {
      console.error('AuthController.devToken error:', error);
      res.status(500).json({ success: false, error: 'Failed to issue dev token' });
    }
  }
}

export const authController = new AuthController();
