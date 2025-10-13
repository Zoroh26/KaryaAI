import { firestore } from '../config/firebase';
import { User, UserRole } from '../models/user.models';

export interface UserFilterOptions {
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface UserUpdateData {
  full_name?: string;
  role?: UserRole;
  skillset?: string[];
  isAvailable?: boolean;
  isActive?: boolean;
}

export class UserService {
  private readonly usersCollection = 'users';

  /**
   * Get all users with optional filtering and pagination
   */
  async getAllUsers(options: UserFilterOptions = {}): Promise<{
    users: User[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      let query: any = firestore.collection(this.usersCollection);

      // Apply filters
      if (options.role) {
        query = query.where('role', '==', options.role);
      }

      if (options.isActive !== undefined) {
        query = query.where('isActive', '==', options.isActive);
      }

      // Get all documents first (without ordering to avoid index issues)
      const snapshot = await query.get();
      
      // Filter out soft-deleted users and sort in memory
      const allDocs = snapshot.docs
        .filter((doc: any) => {
          const data = doc.data();
          return data.isDeleted !== true;
        })
        .sort((a: any, b: any) => {
          const aData = a.data();
          const bData = b.data();
          const aTime = aData.createdAt?.toDate() || new Date(0);
          const bTime = bData.createdAt?.toDate() || new Date(0);
          return bTime.getTime() - aTime.getTime(); // Newest first
        });
      
      const total = allDocs.length;

      // Apply pagination
      const page = options.page || 1;
      const limit = options.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      const users: User[] = [];
      allDocs.slice(startIndex, endIndex).forEach((doc: any) => {
        const userData = doc.data() as User;
        users.push({
          ...userData,
          uid: doc.id,
          // Remove sensitive information
          password: undefined,
        } as User);
      });

      return {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };

    } catch (error: any) {
      console.error('UserService.getAllUsers error:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User> {
    try {
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      const userDoc = await firestore.collection(this.usersCollection).doc(userId).get();

      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data() as User;

      // Check if user is soft deleted
      if (userData.isDeleted === true) {
        throw new Error('User not found');
      }
      
      return {
        ...userData,
        uid: userDoc.id,
        // Remove sensitive information
        password: undefined,
      } as User;

    } catch (error: any) {
      console.error('UserService.getUserById error:', error);
      throw error;
    }
  }

  /**
   * Update user data
   */
  async updateUser(userId: string, updateData: UserUpdateData): Promise<User> {
    try {
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      // Check if user exists and is not deleted
      const userDoc = await firestore.collection(this.usersCollection).doc(userId).get();
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const currentUserData = userDoc.data() as User;
      
      if (currentUserData.isDeleted === true) {
        throw new Error('Cannot update deleted user');
      }

      // Prepare update data
      const updates: any = {
        updatedAt: new Date(),
      };

      // Validate and add fields to update
      if (updateData.full_name !== undefined) {
        if (!updateData.full_name.trim()) {
          throw new Error('Full name cannot be empty');
        }
        updates.full_name = updateData.full_name.trim();
      }

      if (updateData.role !== undefined) {
        const validRoles: UserRole[] = ['client', 'admin', 'employee'];
        if (!validRoles.includes(updateData.role)) {
          throw new Error('Invalid role');
        }
        updates.role = updateData.role;
      }

      if (updateData.isActive !== undefined) {
        updates.isActive = updateData.isActive;
      }

      // Role-specific updates
      if (updateData.skillset !== undefined) {
        if (currentUserData.role !== 'employee' && updateData.role !== 'employee') {
          throw new Error('Only employees can have skillsets');
        }
        updates.skillset = updateData.skillset;
      }

      if (updateData.isAvailable !== undefined) {
        if (currentUserData.role !== 'employee' && updateData.role !== 'employee') {
          throw new Error('Only employees can have availability status');
        }
        updates.isAvailable = updateData.isAvailable;
      }

      // Update the document
      await firestore.collection(this.usersCollection).doc(userId).update(updates);

      // Return updated user data
      return await this.getUserById(userId);

    } catch (error: any) {
      console.error('UserService.updateUser error:', error);
      throw error;
    }
  }

  /**
   * Soft delete user (set isDeleted flag)
   */
  async softDeleteUser(userId: string): Promise<void> {
    try {
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      // Check if user exists
      const userDoc = await firestore.collection(this.usersCollection).doc(userId).get();
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data() as User;

      if (userData.isDeleted === true) {
        throw new Error('User is already deleted');
      }

      // Prevent deleting super admin (optional security check)
      if (userData.role === 'admin' && userData.email === process.env.SUPER_ADMIN_EMAIL) {
        throw new Error('Cannot delete super admin user');
      }

      // Soft delete by setting flags
      await firestore.collection(this.usersCollection).doc(userId).update({
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`User ${userId} soft deleted successfully`);

    } catch (error: any) {
      console.error('UserService.softDeleteUser error:', error);
      throw error;
    }
  }

  /**
   * Restore soft deleted user
   */
  async restoreUser(userId: string): Promise<User> {
    try {
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      const userDoc = await firestore.collection(this.usersCollection).doc(userId).get();
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data() as User;

      if (userData.isDeleted !== true) {
        throw new Error('User is not deleted');
      }

      // Restore user
      await firestore.collection(this.usersCollection).doc(userId).update({
        isDeleted: false,
        isActive: true,
        deletedAt: null,
        updatedAt: new Date(),
      });

      return await this.getUserById(userId);

    } catch (error: any) {
      console.error('UserService.restoreUser error:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    deletedUsers: number;
    usersByRole: Record<UserRole, number>;
  }> {
    try {
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      const allUsersSnapshot = await firestore.collection(this.usersCollection).get();
      const activeUsersSnapshot = await firestore.collection(this.usersCollection)
        .where('isActive', '==', true)
        .where('isDeleted', '!=', true)
        .get();
      const deletedUsersSnapshot = await firestore.collection(this.usersCollection)
        .where('isDeleted', '==', true)
        .get();

      const usersByRole: Record<UserRole, number> = {
        client: 0,
        admin: 0,
        employee: 0
      };

      activeUsersSnapshot.docs.forEach(doc => {
        const user = doc.data() as User;
        if (user.role && usersByRole.hasOwnProperty(user.role)) {
          usersByRole[user.role]++;
        }
      });

      return {
        totalUsers: allUsersSnapshot.size,
        activeUsers: activeUsersSnapshot.size,
        deletedUsers: deletedUsersSnapshot.size,
        usersByRole
      };

    } catch (error: any) {
      console.error('UserService.getUserStats error:', error);
      throw error;
    }
  }

  /**
   * Get available employees
   */
  async getAvailableEmployees(): Promise<User[]> {
    try {
      if (!firestore) {
        throw new Error('Firestore not initialized');
      }

      const snapshot = await firestore
        .collection(this.usersCollection)
        .where('role', '==', 'employee')
        .where('isActive', '==', true)
        .where('isAvailable', '==', true)
        .get();

      // Filter out deleted employees and sort by name
      const employees = snapshot.docs
        .filter((doc: any) => {
          const data = doc.data();
          return data.isDeleted !== true;
        })
        .map((doc: any) => ({
          uid: doc.id,
          ...doc.data()
        }) as User)
        .sort((a, b) => a.full_name.localeCompare(b.full_name));

      return employees;

    } catch (error: any) {
      console.error('UserService.getAvailableEmployees error:', error);
      throw error;
    }
  }
}

export const userService = new UserService();
