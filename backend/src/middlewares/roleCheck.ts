import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { storage } from '../storage';

export const requireRole = (allowedRoles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const user = await storage.getUser(req.user.uid);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      if (!allowedRoles.includes(user.role)) {
        res.status(403).json({ 
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
        });
        return;
      }

      req.user.role = user.role;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ message: 'Internal server error' });
      return;
    }
  };
};

export const requireAdmin = requireRole(['admin']);
export const requireEmployeeOrAdmin = requireRole(['employee', 'admin']);
export const requireClientOrAdmin = requireRole(['client', 'admin']);
