import { auth, firestore } from '../config/firebase';
import { User, UserRole } from '../models/user.models';

export interface SignupData {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  skillset?: string[];
}

export interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  /**
   * Create a new user account
   */
  async createUser(userData: SignupData): Promise<{ uid: string; user: Partial<User> }> {
    try {
      // Validate role
      const validRoles: UserRole[] = ['client', 'admin', 'employee'];
      if (!validRoles.includes(userData.role)) {
        throw new Error('Invalid role. Must be client, admin, or employee');
      }

      if (!auth || !firestore) {
        throw new Error('Firebase services not initialized');
      }

      // Create Firebase Auth user
      const userRecord = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.full_name,
      });

      // Set custom claims for role
      await auth.setCustomUserClaims(userRecord.uid, { role: userData.role });

      // Prepare user document data
      const firestoreUserData: any = {
        full_name: userData.full_name,
        email: userData.email,
        role: userData.role,
        isActive: true,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add role-specific fields
      if (userData.role === 'employee') {
        firestoreUserData.skillset = userData.skillset || [];
        firestoreUserData.isAvailable = true;
      }

      console.log('Creating user document with data:', firestoreUserData);

      // Save to Firestore
      await firestore.collection('users').doc(userRecord.uid).set(firestoreUserData);

      return {
        uid: userRecord.uid,
        user: {
          uid: userRecord.uid,
          full_name: userData.full_name,
          email: userData.email,
          role: userData.role,
        }
      };

    } catch (error: any) {
      console.error('AuthService.createUser error:', error);
      throw error;
    }
  }

  /**
   * Authenticate user and create custom token
   */
  async authenticateUser(loginData: LoginData): Promise<{ token: string; user: User }> {
    try {
      if (!auth || !firestore) {
        throw new Error('Firebase services not initialized');
      }

      // Get user by email
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(loginData.email);
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          throw new Error('Invalid credentials - user not found');
        }
        throw error;
      }

      // Get user data from Firestore
      const userDoc = await firestore.collection('users').doc(userRecord.uid).get();
      
      if (!userDoc.exists) {
        throw new Error('User profile not found in database');
      }

      const userData = userDoc.data() as User;

      // Create custom token
      const customToken = await auth.createCustomToken(userRecord.uid, {
        role: userData.role,
        email: userData.email
      });

      const completeUserData: User = {
        uid: userRecord.uid,
        email: userRecord.email || userData.email,
        full_name: userData.full_name,
        role: userData.role,
        skillset: userData.skillset,
        isAvailable: userData.isAvailable,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      };

      return {
        token: customToken,
        user: completeUserData
      };

    } catch (error: any) {
      console.error('AuthService.authenticateUser error:', error);
      throw error;
    }
  }

  /**
   * Revoke user's refresh tokens (for logout)
   */
  async revokeUserTokens(uid: string): Promise<void> {
    try {
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }

      await auth.revokeRefreshTokens(uid);
      console.log('Refresh tokens revoked for user:', uid);

    } catch (error: any) {
      console.error('AuthService.revokeUserTokens error:', error);
      // Don't throw error for token revocation failures
      console.warn('Could not revoke refresh tokens, continuing with logout');
    }
  }

  /**
   * Validate required fields for signup
   */
  validateSignupData(data: any): void {
    const { email, password, full_name, role } = data;

    if (!email || !password || !full_name || !role) {
      throw new Error('Missing required fields: email, password, full_name, role');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Password strength validation
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
  }

  /**
   * Validate required fields for login
   */
  validateLoginData(data: any): void {
    const { email, password } = data;

    if (!email || !password) {
      throw new Error('Email and password are required');
    }
  }
}

export const authService = new AuthService();
