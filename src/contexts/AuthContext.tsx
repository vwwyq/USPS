import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  userRole: string;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>('student');
  const [loading, setLoading] = useState(true);

  async function register(email: string, password: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email,
        name: email.split('@')[0],
        walletBalance: 0,
        createdAt: new Date()
      });
      
      return userCredential;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  async function login(email: string, password: string) {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  async function logout() {
    try {
      return await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // Try to get user role from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            // If role is explicitly set in the database, use that
            const userData = userDoc.data();
            if (userData.role) {
              setUserRole(userData.role);
            } else if (user.email?.includes('admin')) {
              // Otherwise use email-based role detection
              setUserRole('admin');
            } else {
              setUserRole('student');
            }
          } else {
            // If no user document exists yet, create one
            await setDoc(doc(db, 'users', user.uid), {
              email: user.email,
              name: user.displayName || user.email?.split('@')[0] || 'User',
              walletBalance: 0,
              role: user.email?.includes('admin') ? 'admin' : 'student',
              createdAt: new Date()
            });
            
            // Set role based on email
            if (user.email?.includes('admin')) {
              setUserRole('admin');
            } else {
              setUserRole('student');
            }
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          // Default to student role if there's an error
          setUserRole('student');
        }
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}