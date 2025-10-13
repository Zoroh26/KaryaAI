import { Request, Response, NextFunction } from 'express';
import { auth, firestore } from '../config/firebase';
import { User, UserRole } from '../models/user.models';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export class AuthMiddleware {
  // Main authentication middleware
  public static async authenticateToken(
    req: AuthenticatedRequest, 
    res: Response, 
    next: NextFunction
  ): Promise<void> {
    try {
      // First, try to get token from cookies
      let token = req.cookies?.auth_token;
      
      // If no cookie token, fall back to Authorization header
      if (!token) {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.status(401).json({
            success: false,
            error: 'No valid authorization token provided (cookie or Bearer header)',
            code: 'NO_TOKEN'
          });
          return;
        }

        token = authHeader.split('Bearer ')[1];
      }
      
      if (!auth) {
        res.status(500).json({
          success: false,
          error: 'Firebase Auth not initialized',
          code: 'AUTH_NOT_INITIALIZED'
        });
        return;
      }

      // For custom tokens, we need to handle them differently
      // Since we're using custom tokens from cookies, we'll verify by checking the user exists
      let decodedToken;
      let uid: string;
      
      try {
        // Try to verify as ID token first
        decodedToken = await auth.verifyIdToken(token);
        uid = decodedToken.uid;
      } catch (error) {
        // If that fails, treat it as a custom token and extract user info differently
        // For now, we'll get user info from the user_info cookie
        const userInfoCookie = req.cookies?.user_info;
        if (userInfoCookie) {
          try {
            const userInfo = JSON.parse(userInfoCookie);
            uid = userInfo.uid;
            
            // Verify the user still exists in Firebase Auth
            await auth.getUser(uid);
            
            decodedToken = {
              uid: userInfo.uid,
              email: userInfo.email,
              role: userInfo.role
            };
          } catch (parseError) {
            res.status(401).json({
              success: false,
              error: 'Invalid authentication token or user info',
              code: 'INVALID_TOKEN'
            });
            return;
          }
        } else {
          res.status(401).json({
            success: false,
            error: 'Invalid authentication token',
            code: 'INVALID_TOKEN'
          });
          return;
        }
      }
      
      if (!firestore) {
        res.status(500).json({
          success: false,
          error: 'Firestore not initialized',
          code: 'FIRESTORE_NOT_INITIALIZED'
        });
        return;
      }

      // Get user data from Firestore
      const userDoc = await firestore.collection('users').doc(uid).get();
      
      if (!userDoc.exists) {
        res.status(401).json({
          success: false,
          error: 'User not found in database',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      const userData = userDoc.data() as Omit<User, 'uid' | 'email'>;
      
      // Attach user to request
      req.user = {
        uid: uid,
        email: decodedToken.email || '',
        ...userData
      };

      next();
    } catch (error: any) {
      console.error('Auth verification error:', error);
      
      if (error.code === 'auth/id-token-expired') {
        res.status(401).json({
          success: false,
          error: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
        return;
      }
      
      if (error.code === 'auth/invalid-id-token') {
        res.status(401).json({
          success: false,
          error: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        error: 'Authentication failed',
        code: 'AUTH_ERROR'
      });
    }
  }

  // Role-based access control middleware
  public static requireRole(allowedRoles: UserRole[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          code: 'NOT_AUTHENTICATED'
        });
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
          code: 'ACCESS_DENIED'
        });
        return;
      }

      next();
    };
  }
}

// Export individual functions for easier use
export const authenticateToken = AuthMiddleware.authenticateToken;
export const requireRole = AuthMiddleware.requireRole;
export const requireAdmin = AuthMiddleware.requireRole(['admin']);
export const requireEmployee = AuthMiddleware.requireRole(['employee']);
export const requireClient = AuthMiddleware.requireRole(['client']);
export const requireEmployeeOrAdmin = AuthMiddleware.requireRole(['employee', 'admin']);
export const requireClientOrAdmin = AuthMiddleware.requireRole(['client', 'admin']);

// Export the class as well
export const authMiddleware = {
  verifyToken: AuthMiddleware.authenticateToken,
  requireRole: AuthMiddleware.requireRole,
  requireAdmin,
  requireEmployee,
  requireClient,
  requireEmployeeOrAdmin,
  requireClientOrAdmin
};
