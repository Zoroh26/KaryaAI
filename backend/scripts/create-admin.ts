import { auth, firestore } from '../src/config/firebase';
import * as dotenv from 'dotenv';

dotenv.config();

async function createAdmin() {
  if (!auth || !firestore) {
    console.error('Firebase not initialized. Check your .env file.');
    process.exit(1);
  }

  const email = process.argv[2] || 'admin@karyaai.com';
  const password = process.argv[3] || 'Admin@123';
  const fullName = process.argv[4] || 'Super Admin';

  try {
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log(`User ${email} already exists. Updating role to admin...`);
      
      // Update password if a specific one was passed
      if (process.argv[3]) {
        await auth.updateUser(userRecord.uid, { password });
        console.log(`Password updated for existing user.`);
      }
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        console.log(`Creating new admin user: ${email}`);
        userRecord = await auth.createUser({
          email,
          password,
          displayName: fullName,
        });
      } else {
        throw err;
      }
    }

    // Set custom claims for role
    await auth.setCustomUserClaims(userRecord.uid, { role: 'admin' });

    // Update Firestore document
    await firestore.collection('users').doc(userRecord.uid).set({
      email,
      full_name: fullName,
      role: 'admin',
      isActive: true,
      isDeleted: false,
      updatedAt: new Date(),
      // Only set createdAt if the document doesn't exist to avoid overwriting
    }, { merge: true });

    console.log(`\n✅ Super user created/updated successfully!`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`\nYou can now log in to the admin dashboard using these credentials.`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to create admin user:', error);
    process.exit(1);
  }
}

createAdmin();
