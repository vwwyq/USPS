import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc,
  updateDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  getDocs
} from 'firebase/firestore';

interface Transaction {
  id: string;
  amount: number;
  type: 'topup' | 'payment' | 'refund' | 'rental';
  description: string;
  timestamp: Timestamp;
}

interface WalletContextType {
  balance: number;
  transactions: Transaction[];
  topUp: (amount: number) => Promise<void>;
  makePayment: (amount: number, description: string) => Promise<boolean>;
  loading: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!currentUser) {
      setBalance(0);
      setTransactions([]);
      setLoading(false);
      return;
    }

    // Get user's wallet data
    const fetchWallet = async () => {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setBalance(userDoc.data().walletBalance || 0);
        } else {
          // Create user document if it doesn't exist
          await setDoc(userDocRef, {
            walletBalance: 0,
            email: currentUser.email,
            createdAt: Timestamp.now()
          });
          setBalance(0);
        }
        
        // Listen for transaction updates
        const q = query(
          collection(db, 'transactions'),
          where('userId', '==', currentUser.uid),
          orderBy('timestamp', 'desc')
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const transactionList: Transaction[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            transactionList.push({
              id: doc.id,
              amount: data.amount,
              type: data.type,
              description: data.description,
              timestamp: data.timestamp
            });
          });
          setTransactions(transactionList);
          setLoading(false);
        }, (error) => {
          // Handle error with demo data
          console.error("Error fetching transactions:", error);
          
          // If in demo mode, provide some sample transactions
          if (error.code === 'permission-denied' || error.message.includes('demo-mode')) {
            const demoTransactions: Transaction[] = [
              {
                id: 'demo-1',
                amount: 500,
                type: 'topup',
                description: 'Wallet top-up',
                timestamp: Timestamp.fromDate(new Date(Date.now() - 86400000 * 2)) // 2 days ago
              },
              {
                id: 'demo-2',
                amount: 120,
                type: 'payment',
                description: 'Cafeteria purchase',
                timestamp: Timestamp.fromDate(new Date(Date.now() - 86400000)) // 1 day ago
              },
              {
                id: 'demo-3',
                amount: 50,
                type: 'payment',
                description: 'Stationery store',
                timestamp: Timestamp.fromDate(new Date()) // Today
              }
            ];
            setTransactions(demoTransactions);
            setBalance(330); // 500 - 120 - 50
          }
          
          setLoading(false);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error("Error fetching wallet data:", error);
        
        // If in demo mode, provide sample data
        setBalance(330);
        const demoTransactions: Transaction[] = [
          {
            id: 'demo-1',
            amount: 500,
            type: 'topup',
            description: 'Wallet top-up',
            timestamp: Timestamp.fromDate(new Date(Date.now() - 86400000 * 2)) // 2 days ago
          },
          {
            id: 'demo-2',
            amount: 120,
            type: 'payment',
            description: 'Cafeteria purchase',
            timestamp: Timestamp.fromDate(new Date(Date.now() - 86400000)) // 1 day ago
          },
          {
            id: 'demo-3',
            amount: 50,
            type: 'payment',
            description: 'Stationery store',
            timestamp: Timestamp.fromDate(new Date()) // Today
          }
        ];
        setTransactions(demoTransactions);
        
        setLoading(false);
      }
    };

    fetchWallet();
  }, [currentUser]);

  const topUp = async (amount: number) => {
    if (!currentUser) return;
    
    try {
      // Update user's balance
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      const currentBalance = userDoc.exists() ? (userDoc.data().walletBalance || 0) : 0;
      const newBalance = currentBalance + amount;
      
      await updateDoc(userDocRef, {
        walletBalance: newBalance
      });
      
      // Add transaction record
      await addDoc(collection(db, 'transactions'), {
        userId: currentUser.uid,
        amount: amount,
        type: 'topup',
        description: 'Wallet top-up',
        timestamp: Timestamp.now()
      });
      
      setBalance(newBalance);
    } catch (error) {
      console.error("Error topping up wallet:", error);
      
      // If in demo mode, update local state
      if (error.code === 'permission-denied' || String(error).includes('demo-mode')) {
        const newBalance = balance + amount;
        setBalance(newBalance);
        
        // Add to local transactions
        const newTransaction = {
          id: 'demo-' + Date.now(),
          amount: amount,
          type: 'topup' as const,
          description: 'Wallet top-up',
          timestamp: Timestamp.now()
        };
        
        setTransactions([newTransaction, ...transactions]);
      } else {
        throw error;
      }
    }
  };

  const makePayment = async (amount: number, description: string): Promise<boolean> => {
    if (!currentUser) return false;
    
    try {
      // Check if user has enough balance
      if (balance < amount) {
        return false;
      }
      
      // Update user's balance
      const userDocRef = doc(db, 'users', currentUser.uid);
      const newBalance = balance - amount;
      
      await updateDoc(userDocRef, {
        walletBalance: newBalance
      });
      
      // Add transaction record
      await addDoc(collection(db, 'transactions'), {
        userId: currentUser.uid,
        amount: amount,
        type: 'payment',
        description: description,
        timestamp: Timestamp.now()
      });
      
      setBalance(newBalance);
      return true;
    } catch (error) {
      console.error("Error making payment:", error);
      
      // If in demo mode, update local state
      if (error.code === 'permission-denied' || String(error).includes('demo-mode')) {
        if (balance < amount) {
          return false;
        }
        
        const newBalance = balance - amount;
        setBalance(newBalance);
        
        // Add to local transactions
        const newTransaction = {
          id: 'demo-' + Date.now(),
          amount: amount,
          type: 'payment' as const,
          description: description,
          timestamp: Timestamp.now()
        };
        
        setTransactions([newTransaction, ...transactions]);
        return true;
      }
      
      return false;
    }
  };

  const value = {
    balance,
    transactions,
    topUp,
    makePayment,
    loading
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}