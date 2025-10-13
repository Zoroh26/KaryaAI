import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { authService, SignupData, LoginData } from '../services/auth.service';

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
}

export const authController = new AuthController();
