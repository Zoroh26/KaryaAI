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

      // Verify Firebase ID token
      let decodedToken: any;
      let uid: string;

      try {
        decodedToken = await auth.verifyIdToken(token);
        uid = decodedToken.uid;
      } catch (tokenError: any) {
        // In development, also accept Firebase custom tokens (Admin SDK-issued).
        // Custom tokens are JWTs whose payload contains the uid as the `sub` claim.
        if (process.env.NODE_ENV !== 'production') {
          try {
            // Base64-decode the token payload (standard JWT format: header.payload.sig)
            const payloadBase64 = token.split('.')[1];
            if (payloadBase64) {
              const payload = JSON.parse(
                Buffer.from(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
              );
              if (payload.uid || payload.sub) {
                uid = payload.uid ?? payload.sub;
                // custom tokens store email in claims.email (set in createCustomToken call)
                const emailFromClaims = payload.claims?.email ?? '';
                decodedToken = { uid, email: emailFromClaims };
                console.log(`[DEV] Accepted custom token for uid: ${uid}`);
              }
            }
          } catch {
            // fall through to 401
          }
        }

        if (!uid!) {
          const code = (tokenError as any).code;
          if (code === 'auth/id-token-expired') {
            res.status(401).json({
              success: false,
              error: 'Token expired. Please log in again.',
              code: 'TOKEN_EXPIRED',
            });
            return;
          }
          res.status(401).json({
            success: false,
            error: 'Invalid authentication token.',
            code: 'INVALID_TOKEN',
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

      const userData = userDoc.data() as any;

      // Attach user to request
      // Use Firestore email as primary source (always correct regardless of token type)
      req.user = {
        uid,
        email: userData.email || decodedToken.email || '',
        full_name: userData.full_name,
        role: userData.role,
        skillset: userData.skillset,
        isAvailable: userData.isAvailable,
        isActive: userData.isActive,
        isDeleted: userData.isDeleted,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      };


      next();
    } catch (error: any) {
      console.error('Auth middleware unexpected error:', error);
      res.status(500).json({
        success: false,
        error: 'Authentication failed unexpectedly',
        code: 'AUTH_ERROR',
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
