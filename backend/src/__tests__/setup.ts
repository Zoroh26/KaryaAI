// Mock environment variables before any module is loaded
process.env.NODE_ENV = 'test';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com';
process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN RSA PRIVATE KEY-----\nMOCK\n-----END RSA PRIVATE KEY-----';
process.env.GOOGLE_GEMINI_KEY = 'test-api-key';
