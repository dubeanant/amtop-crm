import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Debug: Log environment variables (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase Config Debug:', {
    apiKey: firebaseConfig.apiKey ? 'SET' : 'MISSING',
    authDomain: firebaseConfig.authDomain ? 'SET' : 'MISSING',
    projectId: firebaseConfig.projectId ? 'SET' : 'MISSING',
    storageBucket: firebaseConfig.storageBucket ? 'SET' : 'MISSING',
    messagingSenderId: firebaseConfig.messagingSenderId ? 'SET' : 'MISSING',
    appId: firebaseConfig.appId ? 'SET' : 'MISSING',
  });
}

// Validate Firebase config
const isConfigValid = Object.values(firebaseConfig).every(value => value && value !== 'your_api_key_here');

if (!isConfigValid) {
  console.error('❌ Firebase configuration is invalid. Please check your .env.local file.');
  console.error('Required environment variables:');
  console.error('- NEXT_PUBLIC_FIREBASE_API_KEY');
  console.error('- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  console.error('- NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  console.error('- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  console.error('- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  console.error('- NEXT_PUBLIC_FIREBASE_APP_ID');
}

// Initialize Firebase only if config is valid
let app: FirebaseApp;
let auth: Auth;

if (isConfigValid) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);

  // Set persistence to local storage
  if (typeof window !== 'undefined') {
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error("Error setting auth persistence:", error);
    });
  }
} else {
  // Create dummy objects to prevent crashes
  app = {} as FirebaseApp;
  auth = {} as Auth;
  console.warn('⚠️ Firebase not initialized due to invalid configuration');
}

export { app, auth };