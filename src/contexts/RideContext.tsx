import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  getDocs,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { useWallet } from './WalletContext';

interface RideRequest {
  id: string;
  riderId: string;
  riderName: string;
  pickup: string;
  dropoff: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  timestamp: Timestamp;
  driverId?: string;
  driverName?: string;
}

interface ScootyRental {
  id: string;
  ownerId: string;
  ownerName: string;
  model: string;
  pricePerHour: number;
  status: 'available' | 'rented' | 'unavailable';
  currentRenterId?: string;
  currentRenterName?: string;
  rentalStart?: Timestamp;
  rentalEnd?: Timestamp;
}

interface RideContextType {
  rideRequests: RideRequest[];
  myRides: RideRequest[];
  availableScooties: ScootyRental[];
  myRentals: ScootyRental[];
  myListedScooties: ScootyRental[];
  requestRide: (pickup: string, dropoff: string) => Promise<void>;
  offerRide: (requestId: string) => Promise<void>;
  completeRide: (requestId: string) => Promise<void>;
  listScooty: (model: string, pricePerHour: number) => Promise<void>;
  rentScooty: (scootyId: string, hours: number) => Promise<boolean>;
  returnScooty: (rentalId: string) => Promise<void>;
  loading: boolean;
}

const RideContext = createContext<RideContextType | undefined>(undefined);

export function useRide() {
  const context = useContext(RideContext);
  if (context === undefined) {
    throw new Error('useRide must be used within a RideProvider');
  }
  return context;
}

export function RideProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const { makePayment } = useWallet();
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [myRides, setMyRides] = useState<RideRequest[]>([]);
  const [availableScooties, setAvailableScooties] = useState<ScootyRental[]>([]);
  const [myRentals, setMyRentals] = useState<ScootyRental[]>([]);
  const [myListedScooties, setMyListedScooties] = useState<ScootyRental[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Demo data for testing without Firebase
  const demoRideRequests: RideRequest[] = [
    {
      id: 'demo-ride-1',
      riderId: 'demo-user-1',
      riderName: 'John Doe',
      pickup: 'University Main Gate',
      dropoff: 'Engineering Block',
      status: 'pending',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 3600000)) // 1 hour ago
    },
    {
      id: 'demo-ride-2',
      riderId: 'demo-user-2',
      riderName: 'Jane Smith',
      pickup: 'Girls Hostel',
      dropoff: 'Library',
      status: 'pending',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 1800000)) // 30 minutes ago
    }
  ];

  const demoMyRides: RideRequest[] = [
    {
      id: 'demo-my-ride-1',
      riderId: currentUser?.uid || 'demo-current-user',
      riderName: currentUser?.email?.split('@')[0] || 'Current User',
      pickup: 'Boys Hostel',
      dropoff: 'Cafeteria',
      status: 'accepted',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 7200000)), // 2 hours ago
      driverId: 'demo-driver-1',
      driverName: 'Driver One'
    },
    {
      id: 'demo-my-ride-2',
      riderId: currentUser?.uid || 'demo-current-user',
      riderName: currentUser?.email?.split('@')[0] || 'Current User',
      pickup: 'Sports Complex',
      dropoff: 'Main Gate',
      status: 'completed',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 86400000)), // 1 day ago
      driverId: 'demo-driver-2',
      driverName: 'Driver Two'
    }
  ];

  const demoAvailableScooties: ScootyRental[] = [
    {
      id: 'demo-scooty-1',
      ownerId: 'demo-owner-1',
      ownerName: 'Alex Johnson',
      model: 'Honda Activa',
      pricePerHour: 50,
      status: 'available'
    },
    {
      id: 'demo-scooty-2',
      ownerId: 'demo-owner-2',
      ownerName: 'Sarah Williams',
      model: 'TVS Jupiter',
      pricePerHour: 45,
      status: 'available'
    },
    {
      id: 'demo-scooty-3',
      ownerId: 'demo-owner-3',
      ownerName: 'Michael Brown',
      model: 'Suzuki Access',
      pricePerHour: 55,
      status: 'available'
    }
  ];

  useEffect(() => {
    if (!currentUser) {
      setRideRequests([]);
      setMyRides([]);
      setAvailableScooties([]);
      setMyRentals([]);
      setMyListedScooties([]);
      setLoading(false);
      return;
    }

    // Check if we're in demo mode
    const checkDemoMode = async () => {
      try {
        // Try to access Firestore to determine if we're in demo mode
        const testDoc = await getDoc(doc(db, 'test', 'test'));
        setIsDemoMode(false);
      } catch (error) {
        console.log("Running in demo mode for ride sharing");
        setIsDemoMode(true);
        
        // Set demo data
        setRideRequests(demoRideRequests);
        setMyRides(demoMyRides);
        setAvailableScooties(demoAvailableScooties);
        setMyRentals([]);
        setMyListedScooties([]);
        setLoading(false);
        return;
      }
    };
    
    checkDemoMode();

    // If not in demo mode, proceed with Firestore listeners
    if (!isDemoMode) {
      try {
        // Listen for ride requests (that are pending and not created by current user)
        const rideRequestsQuery = query(
          collection(db, 'rideRequests'),
          where('status', '==', 'pending'),
          where('riderId', '!=', currentUser.uid),
          orderBy('riderId'), // Required for inequality filter
          orderBy('timestamp', 'desc')
        );
        
        const unsubscribeRideRequests = onSnapshot(rideRequestsQuery, (snapshot) => {
          const requests: RideRequest[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            requests.push({
              id: doc.id,
              riderId: data.riderId,
              riderName: data.riderName,
              pickup: data.pickup,
              dropoff: data.dropoff,
              status: data.status,
              timestamp: data.timestamp
            });
          });
          setRideRequests(requests);
        }, (error) => {
          console.error("Error fetching ride requests:", error);
          setRideRequests(demoRideRequests);
        });

        // Listen for my rides (as rider or driver)
        const myRidesQuery = query(
          collection(db, 'rideRequests'),
          where('riderId', '==', currentUser.uid),
          orderBy('timestamp', 'desc')
        );
        
        const unsubscribeMyRides = onSnapshot(myRidesQuery, (snapshot) => {
          const rides: RideRequest[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            rides.push({
              id: doc.id,
              riderId: data.riderId,
              riderName: data.riderName,
              pickup: data.pickup,
              dropoff: data.dropoff,
              status: data.status,
              timestamp: data.timestamp,
              driverId: data.driverId,
              driverName: data.driverName
            });
          });
          setMyRides(rides);
        }, (error) => {
          console.error("Error fetching my rides:", error);
          setMyRides(demoMyRides);
        });

        // Listen for available scooties
        const scootiesQuery = query(
          collection(db, 'scootyRentals'),
          where('status', '==', 'available'),
          where('ownerId', '!=', currentUser.uid),
          orderBy('ownerId'), // Required for inequality filter
          orderBy('pricePerHour')
        );
        
        const unsubscribeScooties = onSnapshot(scootiesQuery, (snapshot) => {
          const scooties: ScootyRental[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            scooties.push({
              id: doc.id,
              ownerId: data.ownerId,
              ownerName: data.ownerName,
              model: data.model,
              pricePerHour: data.pricePerHour,
              status: data.status
            });
          });
          setAvailableScooties(scooties);
        }, (error) => {
          console.error("Error fetching available scooties:", error);
          setAvailableScooties(demoAvailableScooties);
        });

        // Listen for my rented scooties
        const myRentalsQuery = query(
          collection(db, 'scootyRentals'),
          where('currentRenterId', '==', currentUser.uid),
          where('status', '==', 'rented')
        );
        
        const unsubscribeMyRentals = onSnapshot(myRentalsQuery, (snapshot) => {
          const rentals: ScootyRental[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            rentals.push({
              id: doc.id,
              ownerId: data.ownerId,
              ownerName: data.ownerName,
              model: data.model,
              pricePerHour: data.pricePerHour,
              status: data.status,
              currentRenterId: data.currentRenterId,
              currentRenterName: data.currentRenterName,
              rentalStart: data.rentalStart,
              rentalEnd: data.rentalEnd
            });
          });
          setMyRentals(rentals);
        }, (error) => {
          console.error("Error fetching my rentals:", error);
          setMyRentals([]);
        });

        // Listen for my listed scooties
        const myListedScootiesQuery = query(
          collection(db, 'scootyRentals'),
          where('ownerId', '==', currentUser.uid)
        );
        
        const unsubscribeMyListedScooties = onSnapshot(myListedScootiesQuery, (snapshot) => {
          const scooties: ScootyRental[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            scooties.push({
              id: doc.id,
              ownerId: data.ownerId,
              ownerName: data.ownerName,
              model: data.model,
              pricePerHour: data.pricePerHour,
              status: data.status,
              currentRenterId: data.currentRenterId,
              currentRenterName: data.currentRenterName,
              rentalStart: data.rentalStart,
              rentalEnd: data.rentalEnd
            });
          });
          setMyListedScooties(scooties);
        }, (error) => {
          console.error("Error fetching my listed scooties:", error);
          setMyListedScooties([]);
        });

        setLoading(false);
        
        return () => {
          unsubscribeRideRequests();
          unsubscribeMyRides();
          unsubscribeScooties();
          unsubscribeMyRentals();
          unsubscribeMyListedScooties();
        };
      } catch (error) {
        console.error("Error setting up ride context:", error);
        // Fall back to demo mode
        setIsDemoMode(true);
        setRideRequests(demoRideRequests);
        setMyRides(demoMyRides);
        setAvailableScooties(demoAvailableScooties);
        setMyRentals([]);
        setMyListedScooties([]);
        setLoading(false);
      }
    }
  }, [currentUser, isDemoMode]);

  const requestRide = async (pickup: string, dropoff: string) => {
    if (!currentUser) return;
    
    try {
      if (isDemoMode) {
        // Create a new demo ride request
        const newRide: RideRequest = {
          id: 'demo-new-ride-' + Date.now(),
          riderId: currentUser.uid,
          riderName: currentUser.email?.split('@')[0] || 'Current User',
          pickup,
          dropoff,
          status: 'pending',
          timestamp: Timestamp.now()
        };
        
        // Add to my rides
        setMyRides([newRide, ...myRides]);
        return;
      }
      
      // Get user's name
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const userName = userDoc.exists() ? userDoc.data().name || currentUser.email : currentUser.email;
      
      // Create ride request
      await addDoc(collection(db, 'rideRequests'), {
        riderId: currentUser.uid,
        riderName: userName,
        pickup,
        dropoff,
        status: 'pending',
        timestamp: Timestamp.now()
      });
    } catch (error) {
      console.error("Error requesting ride:", error);
      
      if (isDemoMode || String(error).includes('demo-mode')) {
        // Create a new demo ride request
        const newRide: RideRequest = {
          id: 'demo-new-ride-' + Date.now(),
          riderId: currentUser.uid,
          riderName: currentUser.email?.split('@')[0] || 'Current User',
          pickup,
          dropoff,
          status: 'pending',
          timestamp: Timestamp.now()
        };
        
        // Add to my rides
        setMyRides([newRide, ...myRides]);
        return;
      }
      
      throw error;
    }
  };

  const offerRide = async (requestId: string) => {
    if (!currentUser) return;
    
    try {
      if (isDemoMode) {
        // Update the ride request in the demo data
        const updatedRequests = rideRequests.filter(req => req.id !== requestId);
        setRideRequests(updatedRequests);
        return;
      }
      
      // Get user's name
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const userName = userDoc.exists() ? userDoc.data().name || currentUser.email : currentUser.email;
      
      // Update ride request
      const rideRequestRef = doc(db, 'rideRequests', requestId);
      await updateDoc(rideRequestRef, {
        driverId: currentUser.uid,
        driverName: userName,
        status: 'accepted'
      });
    } catch (error) {
      console.error("Error offering ride:", error);
      
      if (isDemoMode || String(error).includes('demo-mode')) {
        // Update the ride request in the demo data
        const updatedRequests = rideRequests.filter(req => req.id !== requestId);
        setRideRequests(updatedRequests);
        return;
      }
      
      throw error;
    }
  };

  const completeRide = async (requestId: string) => {
    if (!currentUser) return;
    
    try {
      if (isDemoMode) {
        // Update the ride in the demo data
        const updatedRides = myRides.map(ride => {
          if (ride.id === requestId) {
            return { ...ride, status: 'completed' };
          }
          return ride;
        });
        setMyRides(updatedRides);
        return;
      }
      
      // Update ride request
      const rideRequestRef = doc(db, 'rideRequests', requestId);
      await updateDoc(rideRequestRef, {
        status: 'completed',
        completedAt: Timestamp.now()
      });
    } catch (error) {
      console.error("Error completing ride:", error);
      
      if (isDemoMode || String(error).includes('demo-mode')) {
        // Update the ride in the demo data
        const updatedRides = myRides.map(ride => {
          if (ride.id === requestId) {
            return { ...ride, status: 'completed' };
          }
          return ride;
        });
        setMyRides(updatedRides);
        return;
      }
      
      throw error;
    }
  };

  const listScooty = async (model: string, pricePerHour: number) => {
    if (!currentUser) return;
    
    try {
      if (isDemoMode) {
        // Create a new demo scooty listing
        const newScooty: ScootyRental = {
          id: 'demo-new-scooty-' + Date.now(),
          ownerId: currentUser.uid,
          ownerName: currentUser.email?.split('@')[0] || 'Current User',
          model,
          pricePerHour,
          status: 'available'
        };
        
        // Add to my listed scooties
        setMyListedScooties([newScooty, ...myListedScooties]);
        return;
      }
      
      // Get user's name
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const userName = userDoc.exists() ? userDoc.data().name || currentUser.email : currentUser.email;
      
      // Create scooty listing
      await addDoc(collection(db, 'scootyRentals'), {
        ownerId: currentUser.uid,
        ownerName: userName,
        model,
        pricePerHour,
        status: 'available',
        createdAt: Timestamp.now()
      });
    } catch (error) {
      console.error("Error listing scooty:", error);
      
      if (isDemoMode || String(error).includes('demo-mode')) {
        // Create a new demo scooty listing
        const newScooty: ScootyRental = {
          id: 'demo-new-scooty-' + Date.now(),
          ownerId: currentUser.uid,
          ownerName: currentUser.email?.split('@')[0] || 'Current User',
          model,
          pricePerHour,
          status: 'available'
        };
        
        // Add to my listed scooties
        setMyListedScooties([newScooty, ...myListedScooties]);
        return;
      }
      
      throw error;
    }
  };

  const rentScooty = async (scootyId: string, hours: number): Promise<boolean> => {
    if (!currentUser) return false;
    
    try {
      if (isDemoMode) {
        // Find the scooty in the demo data
        const scooty = availableScooties.find(s => s.id === scootyId);
        if (!scooty) return false;
        
        // Calculate total cost
        const totalCost = scooty.pricePerHour * hours;
        
        // Make payment
        const paymentSuccess = await makePayment(totalCost, `Scooty rental: ${scooty.model} for ${hours} hours`);
        if (!paymentSuccess) return false;
        
        // Create a rental
        const rentalStart = Timestamp.now();
        const rentalEnd = new Timestamp(
          rentalStart.seconds + (hours * 3600),
          rentalStart.nanoseconds
        );
        
        const newRental: ScootyRental = {
          ...scooty,
          id: 'demo-rental-' + Date.now(),
          status: 'rented',
          currentRenterId: currentUser.uid,
          currentRenterName: currentUser.email?.split('@')[0] || 'Current User',
          rentalStart,
          rentalEnd
        };
        
        // Update state
        setMyRentals([newRental, ...myRentals]);
        setAvailableScooties(availableScooties.filter(s => s.id !== scootyId));
        
        return true;
      }
      
      // Get scooty details
      const scootyRef = doc(db, 'scootyRentals', scootyId);
      const scootyDoc = await getDoc(scootyRef);
      
      if (!scootyDoc.exists() || scootyDoc.data().status !== 'available') {
        return false;
      }
      
      const scootyData = scootyDoc.data();
      const totalCost = scootyData.pricePerHour * hours;
      
      // Get user's name
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const userName = userDoc.exists() ? userDoc.data().name || currentUser.email : currentUser.email;
      
      // Make payment
      const paymentSuccess = await makePayment(totalCost, `Scooty rental: ${scootyData.model} for ${hours} hours`);
      
      if (!paymentSuccess) {
        return false;
      }
      
      // Calculate rental end time
      const rentalStart = Timestamp.now();
      const rentalEnd = new Timestamp(
        rentalStart.seconds + (hours * 3600),
        rentalStart.nanoseconds
      );
      
      // Update scooty status
      await updateDoc(scootyRef, {
        status: 'rented',
        currentRenterId: currentUser.uid,
        currentRenterName: userName,
        rentalStart,
        rentalEnd
      });
      
      return true;
    } catch (error) {
      console.error("Error renting scooty:", error);
      
      if (isDemoMode || String(error).includes('demo-mode')) {
        // Find the scooty in the demo data
        const scooty = availableScooties.find(s => s.id === scootyId);
        if (!scooty) return false;
        
        // Calculate total cost
        const totalCost = scooty.pricePerHour * hours;
        
        // Make payment
        const paymentSuccess = await makePayment(totalCost, `Scooty rental: ${scooty.model} for ${hours} hours`);
        if (!paymentSuccess) return false;
        
        // Create a rental
        const rentalStart = Timestamp.now();
        const rentalEnd = new Timestamp(
          rentalStart.seconds + (hours * 3600),
          rentalStart.nanoseconds
        );
        
        const newRental: ScootyRental = {
          ...scooty,
          id: 'demo-rental-' + Date.now(),
          status: 'rented',
          currentRenterId: currentUser.uid,
          currentRenterName: currentUser.email?.split('@')[0] || 'Current User',
          rentalStart,
          rentalEnd
        };
        
        // Update state
        setMyRentals([newRental, ...myRentals]);
        setAvailableScooties(availableScooties.filter(s => s.id !== scootyId));
        
        return true;
      }
      
      return false;
    }
  };

  const returnScooty = async (rentalId: string) => {
    if (!currentUser) return;
    
    try {
      if (isDemoMode) {
        // Remove the rental from my rentals
        setMyRentals(myRentals.filter(rental => rental.id !== rentalId));
        return;
      }
      
      // Update scooty status
      const scootyRef = doc(db, 'scootyRentals', rentalId);
      await updateDoc(scootyRef, {
        status: 'available',
        currentRenterId: null,
        currentRenterName: null,
        rentalStart: null,
        rentalEnd: null
      });
    } catch (error) {
      console.error("Error returning scooty:", error);
      
      if (isDemoMode || String(error).includes('demo-mode')) {
        // Remove the rental from my rentals
        setMyRentals(myRentals.filter(rental => rental.id !== rentalId));
        return;
      }
      
      throw error;
    }
  };

  const value = {
    rideRequests,
    myRides,
    availableScooties,
    myRentals,
    myListedScooties,
    requestRide,
    offerRide,
    completeRide,
    listScooty,
    rentScooty,
    returnScooty,
    loading
  };

  return (
    <RideContext.Provider value={value}>
      {children}
    </RideContext.Provider>
  );
}