import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { userService, UserFilterOptions, UserUpdateData } from '../services/user.service';
import { UserRole } from '../models/user.models';

export class UserController {
  /**
   * Get all users (Admin only)
   */
  async getAllUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { role, isActive, page, limit } = req.query;

      const filterOptions: UserFilterOptions = {
        role: role as UserRole,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
      };

      const result = await userService.getAllUsers(filterOptions);

      res.json({
        success: true,
        data: result,
        message: `Retrieved ${result.users.length} users`
      });

    } catch (error: any) {
      console.error('UserController.getAllUsers error:', {
        message: error.message,
        stack: error.stack,
        fullError: error
      });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve users',
        details: error.message,
        code: 'FETCH_USERS_ERROR'
      });
    }
  }

  /**
   * Get user by ID (Admin only)
   */
  async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
          code: 'MISSING_USER_ID'
        });
        return;
      }

      const user = await userService.getUserById(id);

      res.json({
        success: true,
        data: user,
        message: 'User retrieved successfully'
      });

    } catch (error: any) {
      console.error('UserController.getUserById error:', error);

      if (error.message === 'User not found') {
        res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve user',
        code: 'FETCH_USER_ERROR'
      });
    }
  }

  /**
   * Update user (Admin only)
   */
  async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UserUpdateData = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
          code: 'MISSING_USER_ID'
        });
        return;
      }

      // Prevent admin from updating their own role or status
      if (req.user?.uid === id && (updateData.role || updateData.isActive === false)) {
        res.status(403).json({
          success: false,
          error: 'Cannot modify your own role or deactivate yourself',
          code: 'SELF_MODIFICATION_FORBIDDEN'
        });
        return;
      }

      const updatedUser = await userService.updateUser(id, updateData);

      res.json({
        success: true,
        data: updatedUser,
        message: 'User updated successfully'
      });

    } catch (error: any) {
      console.error('UserController.updateUser error:', error);

      if (error.message === 'User not found') {
        res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      if (error.message.includes('Cannot update deleted user') ||
          error.message.includes('Full name cannot be empty') ||
          error.message.includes('Invalid role') ||
          error.message.includes('Only employees')) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update user',
        code: 'UPDATE_USER_ERROR'
      });
    }
  }

  /**
   * Soft delete user (Admin only)
   */
  async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
          code: 'MISSING_USER_ID'
        });
        return;
      }

      // Prevent admin from deleting themselves
      if (req.user?.uid === id) {
        res.status(403).json({
          success: false,
          error: 'Cannot delete yourself',
          code: 'SELF_DELETION_FORBIDDEN'
        });
        return;
      }

      await userService.softDeleteUser(id);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error: any) {
      console.error('UserController.deleteUser error:', error);

      if (error.message === 'User not found') {
        res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      if (error.message.includes('already deleted') ||
          error.message.includes('Cannot delete super admin')) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: 'DELETION_ERROR'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to delete user',
        code: 'DELETE_USER_ERROR'
      });
    }
  }

  /**
   * Restore soft deleted user (Admin only)
   */
  async restoreUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
          code: 'MISSING_USER_ID'
        });
        return;
      }

      const restoredUser = await userService.restoreUser(id);

      res.json({
        success: true,
        data: restoredUser,
        message: 'User restored successfully'
      });

    } catch (error: any) {
      console.error('UserController.restoreUser error:', error);

      if (error.message === 'User not found' || error.message === 'User is not deleted') {
        res.status(404).json({
          success: false,
          error: error.message,
          code: 'RESTORE_ERROR'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to restore user',
        code: 'RESTORE_USER_ERROR'
      });
    }
  }

  /**
   * Get user statistics (Admin only)
   */
  async getUserStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await userService.getUserStats();

      res.json({
        success: true,
        data: stats,
        message: 'User statistics retrieved successfully'
      });

    } catch (error: any) {
      console.error('UserController.getUserStats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve user statistics',
        code: 'STATS_ERROR'
      });
    }
  }

  /**
   * Get available employees (Employee or Admin access)
   */
  async getAvailableEmployees(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const employees = await userService.getAvailableEmployees();

      res.json({
        success: true,
        data: employees,
        message: `Retrieved ${employees.length} available employees`
      });

    } catch (error: any) {
      console.error('UserController.getAvailableEmployees error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve available employees',
        code: 'FETCH_EMPLOYEES_ERROR'
      });
    }
  }
}

export const userController = new UserController();
