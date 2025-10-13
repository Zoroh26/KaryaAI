import { firestore, auth, checkFirebaseConnection } from '../config/firebase';

// Simple database connection service - no CRUD operations
export class DatabaseService {
  
  // Just check if database is connected
  async isConnected(): Promise<boolean> {
    return await checkFirebaseConnection();
  }

  // Get database instance (for future use)
  getFirestore() {
    return firestore;
  }

  // Get auth instance (for future use)
  getAuth() {
    return auth;
  }
}

// Export singleton instance
export const dbService = new DatabaseService();
export default dbService;
