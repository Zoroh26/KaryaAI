import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

// Check if we have the required environment variables
const hasFirebaseConfig = process.env.FIREBASE_PROJECT_ID && 
                          process.env.FIREBASE_CLIENT_EMAIL && 
                          process.env.FIREBASE_PRIVATE_KEY;

if (hasFirebaseConfig && !admin.apps.length) {
  try {
    const firebaseConfig = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
      projectId: firebaseConfig.projectId,
    });

    // Allow undefined values to be silently dropped when writing to Firestore.
    // This prevents runtime errors when optional fields (e.g. estimatedBudget, deadline)
    // are not provided.
    admin.firestore().settings({ ignoreUndefinedProperties: true });

    
    firebaseInitialized = true;
    console.log('🔥 Firebase Admin initialized successfully');
    console.log(`📡 Connected to project: ${firebaseConfig.projectId}`);
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
  }
} else {
  console.warn('⚠️ Firebase configuration not found. Please check your environment variables.');
  console.warn('Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
}

// Export auth and firestore with error handling
export const auth = firebaseInitialized ? admin.auth() : null;
export const firestore = firebaseInitialized ? admin.firestore() : null;
export const db = firestore; // Alias for convenience
export { firebaseInitialized };

// Helper function to check Firebase connection
export const checkFirebaseConnection = async (): Promise<boolean> => {
  if (!firebaseInitialized || !firestore) {
    return false;
  }
  
  try {
    // Try to access Firestore to verify connection
    await firestore.listCollections();
    console.log('✅ Firebase Firestore connection verified');
    return true;
  } catch (error) {
    console.error('❌ Firebase Firestore connection failed:', error);
    return false;
  }
};

export default admin;
