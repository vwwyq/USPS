import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase with demo mode if environment variables are not available
const app = initializeApp(
  // Check if we have valid API key, otherwise use demo mode
  firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("YOUR_API_KEY") 
    ? firebaseConfig 
    : {
        apiKey: "demo-mode",
        authDomain: "demo-mode",
        projectId: "demo-mode",
        storageBucket: "demo-mode",
        messagingSenderId: "demo-mode",
        appId: "demo-mode"
      }
);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Add demo mode functionality to handle authentication in demo mode
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("YOUR_API_KEY")) {
  console.log("Firebase running in demo mode - authentication will be simulated");
  
  // Override auth methods for demo mode
  const originalSignInWithEmailAndPassword = auth.signInWithEmailAndPassword;
  const originalCreateUserWithEmailAndPassword = auth.createUserWithEmailAndPassword;
  
  // @ts-ignore - Overriding for demo purposes
  auth.signInWithEmailAndPassword = async (email: string, password: string) => {
    console.log("Demo login with:", email);
    
    // Simulate successful login
    const userCredential = {
      user: {
        uid: "demo-user-" + Math.random().toString(36).substring(2, 9),
        email: email,
        emailVerified: true,
        displayName: email.split('@')[0],
        isAnonymous: false,
        providerData: [],
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString()
        }
      }
    };
    
    // Simulate auth state change
    setTimeout(() => {
      // @ts-ignore
      auth.onAuthStateChanged.forEach(callback => callback(userCredential.user));
    }, 100);
    
    return Promise.resolve(userCredential);
  };
  
  // @ts-ignore - Overriding for demo purposes
  auth.createUserWithEmailAndPassword = async (email: string, password: string) => {
    console.log("Demo register with:", email);
    
    // Simulate successful registration
    const userCredential = {
      user: {
        uid: "demo-user-" + Math.random().toString(36).substring(2, 9),
        email: email,
        emailVerified: false,
        displayName: null,
        isAnonymous: false,
        providerData: [],
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString()
        }
      }
    };
    
    // Simulate auth state change
    setTimeout(() => {
      // @ts-ignore
      auth.onAuthStateChanged.forEach(callback => callback(userCredential.user));
    }, 100);
    
    return Promise.resolve(userCredential);
  };
  
  // @ts-ignore - Overriding for demo purposes
  auth.signOut = async () => {
    console.log("Demo logout");
    
    // Simulate auth state change
    setTimeout(() => {
      // @ts-ignore
      auth.onAuthStateChanged.forEach(callback => callback(null));
    }, 100);
    
    return Promise.resolve();
  };
  
  // Mock onAuthStateChanged
  const listeners: Function[] = [];
  // @ts-ignore - Overriding for demo purposes
  auth.onAuthStateChanged = (callback: Function) => {
    listeners.push(callback);
    return () => {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  };
  
  // @ts-ignore - Add for demo access
  auth.onAuthStateChanged.forEach = (callback: Function) => {
    listeners.forEach(callback);
  };
}

export default app;