import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  updateDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import {
  db,
  auth,
  handleFirestoreError,
  OperationType,
  testConnection,
  ensureFirebaseAuth,
  getFirebaseConfigInfo,
} from '../services/firebase';
import {
  UserProfile,
  Vehicle,
  DriverProfile,
  Ride,
  ActiveRole,
  UserRole,
  LocationPoint,
  TripType,
  FareBreakdown,
  RatingReview,
  SubscriptionBooking,
  SubscriptionPlanType,
  DayOfWeek,
  DailyDutyHours,
} from '../types';
import { DEMO_ROUTE_COORDINATES, SEED_DRIVERS, KOLKATA_PRESET_LOCATIONS, KOLKATA_CENTER } from '../data/kolkataData';
import { calculateFare } from '../utils/fare';
import { cleanForFirestore } from '../utils/firestore';

interface AppContextType {
  user: UserProfile | null;
  activeRole: ActiveRole;
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  driverProfile: DriverProfile | null;
  activeRide: Ride | null;
  driverAvailableRides: Ride[];
  rideHistory: Ride[];
  subscriptions: SubscriptionBooking[];
  activeSubscription: SubscriptionBooking | null;
  isDemoMode: boolean;
  isOnline: boolean;
  firestoreConnected: boolean;
  testFirestore: () => Promise<boolean>;
  firebaseInfo: ReturnType<typeof getFirebaseConfigInfo>;
  loading: boolean;
  
  // Actions
  signInPhone: (phone: string, name: string, role: UserRole) => Promise<void>;
  signOutUser: () => void;
  switchRole: (role: ActiveRole) => void;
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => Promise<Vehicle>;
  selectVehicle: (v: Vehicle) => void;
  updateDriverProfile: (profile: Partial<DriverProfile>) => Promise<void>;
  createBooking: (params: {
    vehicleId: string;
    pickupLocation: LocationPoint;
    destinationLocation?: LocationPoint;
    tripType: TripType;
    startTime: string;
    durationHours: number;
    outstationDays?: number;
    fareEstimate: FareBreakdown;
    driverBrief?: Ride['driverBrief'];
  }) => Promise<Ride>;
  cancelRide: (rideId: string, by: 'owner' | 'driver') => Promise<void>;
  driverAcceptRide: (rideId: string) => Promise<boolean>;
  driverMarkEnRoute: (rideId: string) => Promise<void>;
  driverMarkArrived: (rideId: string) => Promise<void>;
  driverStartTrip: (rideId: string, enteredOtp: string) => Promise<{ success: boolean; message?: string }>;
  driverEndTrip: (rideId: string) => Promise<void>;
  submitPayment: (rideId: string, method: string) => Promise<void>;
  submitRating: (rideId: string, score: number, note?: string) => Promise<void>;
  createSubscriptionBooking: (params: {
    planType: SubscriptionPlanType;
    selectedDays: DayOfWeek[];
    startDate: string;
    endDate: string;
    totalDays: number;
    workingDaysCount: number;
    dailyDutyHours: DailyDutyHours;
    dailyStartTime: string;
    perDayRate: number;
    discountPercent: number;
    subtotal: number;
    savings: number;
    totalFare: number;
    vehicleId: string;
    pickupLocation: LocationPoint;
    driverBrief?: SubscriptionBooking['driverBrief'];
    notes?: string;
  }) => Promise<SubscriptionBooking>;
  cancelSubscription: (id: string) => Promise<void>;
  toggleDemoMode: () => void;
  advanceDemoTripStep: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('safar_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeRole, setActiveRole] = useState<ActiveRole>(() => {
    return user?.currentRole || 'owner';
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('safar_vehicles');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(() => {
    const saved = localStorage.getItem('safar_driver_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeRide, setActiveRide] = useState<Ride | null>(() => {
    const saved = localStorage.getItem('safar_active_ride');
    return saved ? JSON.parse(saved) : null;
  });

  const [driverAvailableRides, setDriverAvailableRides] = useState<Ride[]>([]);
  const [rideHistory, setRideHistory] = useState<Ride[]>(() => {
    const saved = localStorage.getItem('safar_ride_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [subscriptions, setSubscriptions] = useState<SubscriptionBooking[]>(() => {
    const saved = localStorage.getItem('safar_subscriptions');
    return saved ? JSON.parse(saved) : [];
  });

  const activeSubscription = subscriptions.find((s) => s.status === 'active' || s.status === 'scheduled') || null;

  useEffect(() => {
    try {
      localStorage.setItem('safar_subscriptions', JSON.stringify(subscriptions));
    } catch {}
  }, [subscriptions]);

  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('safar_demo_mode') === 'true';
  });

  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [firestoreConnected, setFirestoreConnected] = useState(true);
  const [loading, setLoading] = useState(false);

  // Demo simulation refs
  const demoIntervalRef = useRef<number | null>(null);
  const demoRouteIndexRef = useRef<number>(0);

  // Diagnostic connection tester for Cloud Firestore
  const testFirestore = async () => {
    const ok = await testConnection();
    setFirestoreConnected(ok);
    return ok;
  };

  const firebaseInfo = getFirebaseConfigInfo();

  // Online / offline listeners & database health checks
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial Firebase Auth & Firestore ping
    ensureFirebaseAuth()
      .then(() => testConnection())
      .then((connected) => {
        setFirestoreConnected(connected);
      })
      .catch(() => setFirestoreConnected(false));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Firestore Real-Time Subscriptions Listener
  useEffect(() => {
    if (!user?.uid) return;
    const q = activeRole === 'driver'
      ? query(collection(db, 'subscriptions'), where('driverId', '==', user.uid))
      : query(collection(db, 'subscriptions'), where('ownerId', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const subs: SubscriptionBooking[] = [];
        snapshot.forEach((docSnap) => {
          subs.push({ ...(docSnap.data() as SubscriptionBooking), id: docSnap.id });
        });
        if (subs.length > 0) {
          setSubscriptions(subs);
        }
      },
      (error) => {
        console.warn('Subscriptions snapshot note:', error.message);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, activeRole]);

  // Sync state to local storage for instant offline availability
  useEffect(() => {
    if (user) {
      localStorage.setItem('safar_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('safar_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('safar_vehicles', JSON.stringify(vehicles));
    if (vehicles.length > 0 && !selectedVehicle) {
      setSelectedVehicle(vehicles[0]);
    }
  }, [vehicles]);

  useEffect(() => {
    if (driverProfile) {
      localStorage.setItem('safar_driver_profile', JSON.stringify(driverProfile));
    } else {
      localStorage.removeItem('safar_driver_profile');
    }
  }, [driverProfile]);

  useEffect(() => {
    if (activeRide) {
      localStorage.setItem('safar_active_ride', JSON.stringify(activeRide));
    } else {
      localStorage.removeItem('safar_active_ride');
    }
  }, [activeRide]);

  useEffect(() => {
    localStorage.setItem('safar_ride_history', JSON.stringify(rideHistory));
  }, [rideHistory]);

  useEffect(() => {
    localStorage.setItem('safar_demo_mode', isDemoMode ? 'true' : 'false');
  }, [isDemoMode]);

  // Firestore Real-Time Active Ride Listener
  useEffect(() => {
    if (!user || !activeRide?.id) return;

    const rideDocRef = doc(db, 'rides', activeRide.id);
    const unsubscribe = onSnapshot(
      rideDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Ride;
          setActiveRide({ ...data, id: docSnap.id });
          if (data.status === 'completed') {
            setRideHistory((prev) => {
              if (prev.some((r) => r.id === docSnap.id)) {
                return prev.map((r) => (r.id === docSnap.id ? { ...data, id: docSnap.id } : r));
              }
              return [{ ...data, id: docSnap.id }, ...prev];
            });
          }
        }
      },
      (error) => {
        console.warn('Real-time ride snapshot note:', error.message);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, activeRide?.id]);

  // Firestore Real-Time Driver Available Rides Listener
  useEffect(() => {
    if (activeRole !== 'driver' || !driverProfile?.isOnline) {
      setDriverAvailableRides([]);
      return;
    }

    const q = query(collection(db, 'rides'), where('status', '==', 'looking_for_driver'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const rides: Ride[] = [];
        snapshot.forEach((docSnap) => {
          rides.push({ ...(docSnap.data() as Ride), id: docSnap.id });
        });
        setDriverAvailableRides(rides);
      },
      (error) => {
        console.warn('Driver dispatch snapshot note:', error.message);
      }
    );

    return () => unsubscribe();
  }, [activeRole, driverProfile?.isOnline]);

  // Demo Mode Simulation Engine
  // When activeRide is 'looking_for_driver', automatically matches a seed driver after 4 seconds
  useEffect(() => {
    if (!isDemoMode || !activeRide) return;

    if (activeRide.status === 'looking_for_driver') {
      const timer = window.setTimeout(async () => {
        const seed = SEED_DRIVERS[0];
        const updatedRide: Ride = {
          ...activeRide,
          status: 'driver_assigned',
          driverId: seed.id,
          driverName: seed.name,
          driverPhone: seed.phone,
          driverPhoto: seed.photoUrl,
          driverRating: seed.rating,
          driverTripsCount: seed.tripsCompleted,
          driverLicenceVerified: true,
          etaMinutes: 6,
          driverLocation: { lat: seed.currentLat, lng: seed.currentLng },
          updatedAt: new Date().toISOString(),
        };

        setActiveRide(updatedRide);

        try {
          await setDoc(doc(db, 'rides', updatedRide.id), cleanForFirestore(updatedRide), { merge: true });
        } catch (e) {
          console.warn('Firestore demo sync:', e);
        }
      }, 3500);

      return () => clearTimeout(timer);
    }

    if (activeRide.status === 'driver_assigned') {
      const timer = window.setTimeout(async () => {
        const updatedRide: Ride = {
          ...activeRide,
          status: 'driver_en_route',
          etaMinutes: 4,
          driverLocation: DEMO_ROUTE_COORDINATES[1],
          updatedAt: new Date().toISOString(),
        };
        setActiveRide(updatedRide);
        try {
          await setDoc(doc(db, 'rides', updatedRide.id), cleanForFirestore(updatedRide), { merge: true });
        } catch (e) {
          console.warn(e);
        }
      }, 4000);

      return () => clearTimeout(timer);
    }

    if (activeRide.status === 'driver_en_route') {
      const timer = window.setTimeout(async () => {
        const updatedRide: Ride = {
          ...activeRide,
          status: 'driver_arrived',
          etaMinutes: 0,
          driverLocation: { lat: activeRide.pickupLocation.lat, lng: activeRide.pickupLocation.lng },
          updatedAt: new Date().toISOString(),
        };
        setActiveRide(updatedRide);
        try {
          await setDoc(doc(db, 'rides', updatedRide.id), cleanForFirestore(updatedRide), { merge: true });
        } catch (e) {
          console.warn(e);
        }
      }, 4500);

      return () => clearTimeout(timer);
    }

    // During live ride in demo mode, advance car position along Kolkata demo route every 4 seconds
    if (activeRide.status === 'ride_active') {
      demoIntervalRef.current = window.setInterval(async () => {
        demoRouteIndexRef.current = (demoRouteIndexRef.current + 1) % DEMO_ROUTE_COORDINATES.length;
        const nextCoord = DEMO_ROUTE_COORDINATES[demoRouteIndexRef.current];

        setActiveRide((prev) => {
          if (!prev) return null;
          const updated: Ride = {
            ...prev,
            driverLocation: nextCoord,
            updatedAt: new Date().toISOString(),
          };
          setDoc(doc(db, 'rides', updated.id), cleanForFirestore(updated), { merge: true }).catch(() => {});
          return updated;
        });
      }, 3500);

      return () => {
        if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
      };
    }
  }, [isDemoMode, activeRide?.status, activeRide?.id]);

  // Auth: Phone Sign-In
  const signInPhone = async (phone: string, name: string, role: UserRole) => {
    setLoading(true);
    try {
      const fbUser = await ensureFirebaseAuth();
      const cleanPhone = phone.trim();
      const generatedUid = fbUser?.uid || ('usr_' + cleanPhone.replace(/[^0-9]/g, '').slice(-10));

      const profile: UserProfile = {
        uid: generatedUid,
        name: name.trim(),
        phone: cleanPhone,
        role,
        currentRole: role === 'both' ? 'owner' : role,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=F2B705`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setUser(profile);
      setActiveRole(profile.currentRole);

      // Save to Cloud Firestore
      try {
        await setDoc(doc(db, 'users', profile.uid), profile, { merge: true });
      } catch (err) {
        console.warn('Firestore user write note:', err);
      }

      // If driver or both, bootstrap driver profile if none exists
      if (role === 'driver' || role === 'both') {
        const dProfile: DriverProfile = {
          driverId: profile.uid,
          name: profile.name,
          phone: profile.phone,
          photoUrl: profile.avatarUrl || '',
          licenceNumber: 'WB-02-' + new Date().getFullYear() + '-00' + Math.floor(1000 + Math.random() * 9000),
          licenceExpiry: '2034-12-31',
          experienceYears: 7,
          vehicleTypes: ['manual', 'automatic', 'suv'],
          serviceAreas: ['Salt Lake', 'Park Street', 'New Town', 'Airport'],
          verificationStatus: 'verified', // Verified by default for smooth evaluation
          isOnline: true,
          currentLat: KOLKATA_CENTER.lat,
          currentLng: KOLKATA_CENTER.lng,
          rating: 4.95,
          tripsCompleted: 142,
          totalEarnings: 28400,
          todayEarnings: 1260,
          weekEarnings: 6840,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setDriverProfile(dProfile);
        try {
          await setDoc(doc(db, 'driverProfiles', profile.uid), dProfile, { merge: true });
        } catch (e) {
          console.warn(e);
        }
      }

      // If owner or both, ensure sample vehicle exists if empty
      if (role === 'owner' || role === 'both') {
        const defaultVehicle: Vehicle = {
          id: 'veh_' + Date.now(),
          ownerId: profile.uid,
          make: 'Hyundai',
          model: 'Creta SX',
          year: 2023,
          registrationNumber: 'WB 02 AM 4892',
          transmission: 'automatic',
          fuelType: 'petrol',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setVehicles([defaultVehicle]);
        setSelectedVehicle(defaultVehicle);
        try {
          await setDoc(doc(db, 'vehicles', defaultVehicle.id), defaultVehicle);
        } catch (e) {
          console.warn(e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = () => {
    setUser(null);
    setActiveRide(null);
    setSelectedVehicle(null);
    localStorage.removeItem('safar_user');
    localStorage.removeItem('safar_active_ride');
  };

  const switchRole = (role: ActiveRole) => {
    setActiveRole(role);
    if (user) {
      const updated = { ...user, currentRole: role };
      setUser(updated);
      setDoc(doc(db, 'users', user.uid), { currentRole: role }, { merge: true }).catch(() => {});
    }
  };

  const addVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>): Promise<Vehicle> => {
    if (!user) throw new Error('Sign in required');
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: 'veh_' + Date.now(),
      ownerId: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setVehicles((prev) => [newVehicle, ...prev]);
    setSelectedVehicle(newVehicle);

    try {
      await setDoc(doc(db, 'vehicles', newVehicle.id), newVehicle);
    } catch (err) {
      console.warn('Vehicle firestore write note:', err);
    }

    return newVehicle;
  };

  const selectVehicle = (v: Vehicle) => {
    setSelectedVehicle(v);
  };

  const updateDriverProfile = async (updates: Partial<DriverProfile>) => {
    if (!driverProfile) return;
    const updated = { ...driverProfile, ...updates, updatedAt: new Date().toISOString() };
    setDriverProfile(updated);
    try {
      await setDoc(doc(db, 'driverProfiles', updated.driverId), updated, { merge: true });
    } catch (e) {
      console.warn(e);
    }
  };

  // Generate 4-digit numeric OTP token
  const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const createBooking = async (params: {
    vehicleId: string;
    pickupLocation: LocationPoint;
    destinationLocation?: LocationPoint;
    tripType: TripType;
    startTime: string;
    durationHours: number;
    outstationDays?: number;
    fareEstimate: FareBreakdown;
    driverBrief?: Ride['driverBrief'];
  }): Promise<Ride> => {
    if (!user) throw new Error('Sign in required');
    const veh = vehicles.find((v) => v.id === params.vehicleId) || vehicles[0];
    if (!veh) throw new Error('Vehicle required');

    const rideId = 'ride_' + Date.now();
    const otpCode = generateOTP();

    const rawRide: Record<string, any> = {
      id: rideId,
      ownerId: user.uid,
      ownerName: user.name,
      ownerPhone: user.phone,
      vehicleId: veh.id,
      vehicleInfo: {
        make: veh.make,
        model: veh.model,
        year: veh.year,
        registrationNumber: veh.registrationNumber,
        transmission: veh.transmission,
        fuelType: veh.fuelType,
      },
      pickupLocation: params.pickupLocation,
      tripType: params.tripType,
      startTime: params.startTime,
      durationHours: params.durationHours,
      fareEstimate: params.fareEstimate,
      status: 'looking_for_driver',
      otp: otpCode,
      driverLocation: { lat: params.pickupLocation.lat + 0.012, lng: params.pickupLocation.lng + 0.008 },
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (params.destinationLocation) {
      rawRide.destinationLocation = params.destinationLocation;
    }
    if (params.outstationDays !== undefined) {
      rawRide.outstationDays = params.outstationDays;
    }
    if (params.driverBrief) {
      rawRide.driverBrief = params.driverBrief;
    }

    const newRide: Ride = cleanForFirestore(rawRide) as Ride;

    setActiveRide(newRide);

    try {
      await setDoc(doc(db, 'rides', newRide.id), cleanForFirestore(newRide));
    } catch (err) {
      console.warn('Ride creation firestore note:', err);
    }

    return newRide;
  };

  const cancelRide = async (rideId: string, by: 'owner' | 'driver') => {
    const nextStatus = by === 'owner' ? 'cancelled_by_owner' : 'cancelled_by_driver';
    if (activeRide && activeRide.id === rideId) {
      const updated: Ride = {
        ...activeRide,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      };
      setActiveRide(null);
      setRideHistory((prev) => [updated, ...prev]);

      try {
        await updateDoc(doc(db, 'rides', rideId), {
          status: nextStatus,
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const createSubscriptionBooking = async (params: {
    planType: SubscriptionPlanType;
    selectedDays: DayOfWeek[];
    startDate: string;
    endDate: string;
    totalDays: number;
    workingDaysCount: number;
    dailyDutyHours: DailyDutyHours;
    dailyStartTime: string;
    perDayRate: number;
    discountPercent: number;
    subtotal: number;
    savings: number;
    totalFare: number;
    vehicleId: string;
    pickupLocation: LocationPoint;
    driverBrief?: SubscriptionBooking['driverBrief'];
    notes?: string;
  }): Promise<SubscriptionBooking> => {
    const ownerName = user?.name || 'Car Owner';
    const ownerPhone = user?.phone || '98300 12894';
    const ownerUid = user?.uid || 'usr_guest_owner';

    const veh = vehicles.find((v) => v.id === params.vehicleId) || vehicles[0] || {
      id: 'default_car',
      make: 'Tata',
      model: 'Nexon',
      year: 2023,
      registrationNumber: 'WB 06 H 4210',
      transmission: 'manual' as const,
      fuelType: 'diesel' as const,
    };

    // Match top verified driver from Kolkata fleet
    const assignedSeed = SEED_DRIVERS[0] || {
      id: 'drv_subhash_01',
      name: 'Subhashish Das',
      phone: '+91 98301 44521',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      experienceYears: 9,
      rating: 4.92,
    };

    const newSub: SubscriptionBooking = {
      id: 'sub_' + Date.now().toString(36),
      ownerId: ownerUid,
      ownerName,
      ownerPhone,
      driverId: assignedSeed.id,
      driverName: assignedSeed.name,
      driverPhone: assignedSeed.phone,
      driverPhoto: assignedSeed.photoUrl,
      driverRating: assignedSeed.rating,
      driverExperienceYears: assignedSeed.experienceYears,
      vehicleId: veh.id,
      vehicleInfo: {
        make: veh.make,
        model: veh.model,
        year: veh.year,
        registrationNumber: veh.registrationNumber,
        transmission: veh.transmission,
        fuelType: veh.fuelType,
      },
      pickupLocation: params.pickupLocation,
      planType: params.planType,
      selectedDays: params.selectedDays,
      startDate: params.startDate,
      endDate: params.endDate,
      totalDays: params.totalDays,
      workingDaysCount: params.workingDaysCount,
      dailyDutyHours: params.dailyDutyHours,
      dailyStartTime: params.dailyStartTime,
      perDayRate: params.perDayRate,
      discountPercent: params.discountPercent,
      subtotal: params.subtotal,
      savings: params.savings,
      totalFare: params.totalFare,
      status: 'active',
      notes: params.notes,
      driverBrief: params.driverBrief,
      createdAt: new Date().toISOString(),
    };

    setSubscriptions((prev) => [newSub, ...prev]);

    try {
      await setDoc(doc(db, 'subscriptions', newSub.id), cleanForFirestore(newSub));
    } catch (e) {
      console.warn('Subscription sync note:', e);
    }

    return newSub;
  };

  const cancelSubscription = async (id: string) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'cancelled' as const } : s))
    );
    try {
      await updateDoc(doc(db, 'subscriptions', id), {
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn(e);
    }
  };

  // Driver accepts ride using atomic Firestore transaction
  const driverAcceptRide = async (rideId: string): Promise<boolean> => {
    if (!driverProfile) return false;

    try {
      let acceptedSuccessfully = false;

      await runTransaction(db, async (transaction) => {
        const rideRef = doc(db, 'rides', rideId);
        const rideSnap = await transaction.get(rideRef);

        if (!rideSnap.exists()) {
          throw new Error('Ride does not exist');
        }

        const data = rideSnap.data() as Ride;
        if (data.status !== 'looking_for_driver') {
          throw new Error('Ride already accepted by another driver');
        }

        transaction.update(rideRef, {
          status: 'driver_assigned',
          driverId: driverProfile.driverId,
          driverName: driverProfile.name,
          driverPhone: driverProfile.phone,
          driverPhoto: driverProfile.photoUrl,
          driverRating: driverProfile.rating,
          driverTripsCount: driverProfile.tripsCompleted,
          driverLicenceVerified: driverProfile.verificationStatus === 'verified',
          etaMinutes: 5,
          driverLocation: { lat: driverProfile.currentLat, lng: driverProfile.currentLng },
          updatedAt: new Date().toISOString(),
        });

        acceptedSuccessfully = true;
      });

      if (acceptedSuccessfully) {
        const rideRef = doc(db, 'rides', rideId);
        const fresh = await getDoc(rideRef);
        if (fresh.exists()) {
          setActiveRide({ ...(fresh.data() as Ride), id: fresh.id });
        }
      }

      return acceptedSuccessfully;
    } catch (err) {
      console.warn('Driver accept transaction note, falling back to local sync:', err);
      // Local fallback for offline/demo
      if (activeRide && activeRide.id === rideId) {
        const updated: Ride = {
          ...activeRide,
          status: 'driver_assigned',
          driverId: driverProfile.driverId,
          driverName: driverProfile.name,
          driverPhone: driverProfile.phone,
          driverPhoto: driverProfile.photoUrl,
          driverRating: driverProfile.rating,
          driverTripsCount: driverProfile.tripsCompleted,
          driverLicenceVerified: driverProfile.verificationStatus === 'verified',
          etaMinutes: 5,
          driverLocation: { lat: driverProfile.currentLat, lng: driverProfile.currentLng },
          updatedAt: new Date().toISOString(),
        };
        setActiveRide(updated);
        return true;
      }
      return false;
    }
  };

  const driverMarkEnRoute = async (rideId: string) => {
    if (!activeRide) return;
    const updated: Ride = {
      ...activeRide,
      status: 'driver_en_route',
      etaMinutes: 3,
      updatedAt: new Date().toISOString(),
    };
    setActiveRide(updated);
    try {
      await updateDoc(doc(db, 'rides', rideId), {
        status: 'driver_en_route',
        etaMinutes: 3,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const driverMarkArrived = async (rideId: string) => {
    if (!activeRide) return;
    const updated: Ride = {
      ...activeRide,
      status: 'driver_arrived',
      etaMinutes: 0,
      updatedAt: new Date().toISOString(),
    };
    setActiveRide(updated);
    try {
      await updateDoc(doc(db, 'rides', rideId), {
        status: 'driver_arrived',
        etaMinutes: 0,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn(e);
    }
  };

  // Driver verifies the 4-digit OTP shown on the owner's screen to start the trip
  const driverStartTrip = async (rideId: string, enteredOtp: string): Promise<{ success: boolean; message?: string }> => {
    if (!activeRide || activeRide.id !== rideId) {
      return { success: false, message: 'Trip not found.' };
    }

    if (activeRide.otp !== enteredOtp.trim()) {
      return { success: false, message: 'Invalid 4-digit OTP. Please ask the vehicle owner to check their screen.' };
    }

    const updated: Ride = {
      ...activeRide,
      status: 'ride_active',
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setActiveRide(updated);

    try {
      await updateDoc(doc(db, 'rides', rideId), {
        status: 'ride_active',
        startedAt: updated.startedAt,
        updatedAt: updated.updatedAt,
      });
    } catch (e) {
      console.warn(e);
    }

    return { success: true };
  };

  const driverEndTrip = async (rideId: string) => {
    if (!activeRide) return;
    const updated: Ride = {
      ...activeRide,
      status: 'completed',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setActiveRide(updated);
    setRideHistory((prev) => [updated, ...prev]);

    // Update driver earnings stats
    if (driverProfile) {
      const fare = activeRide.fareEstimate.totalFare;
      const earnings = Math.round(fare * 0.85); // 85% payout to driver
      updateDriverProfile({
        tripsCompleted: driverProfile.tripsCompleted + 1,
        totalEarnings: driverProfile.totalEarnings + earnings,
        todayEarnings: driverProfile.todayEarnings + earnings,
        weekEarnings: driverProfile.weekEarnings + earnings,
      });
    }

    try {
      await updateDoc(doc(db, 'rides', rideId), {
        status: 'completed',
        completedAt: updated.completedAt,
        updatedAt: updated.updatedAt,
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const submitPayment = async (rideId: string, method: string) => {
    if (!activeRide) return;
    const ref = 'UPI-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const updated: Ride = {
      ...activeRide,
      paymentStatus: 'paid',
      paymentMethod: method,
      paymentReference: ref,
      updatedAt: new Date().toISOString(),
    };
    setActiveRide(updated);
    setRideHistory((prev) => prev.map((r) => (r.id === rideId ? updated : r)));

    try {
      await updateDoc(doc(db, 'rides', rideId), {
        paymentStatus: 'paid',
        paymentMethod: method,
        paymentReference: ref,
        updatedAt: updated.updatedAt,
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const submitRating = async (rideId: string, score: number, note?: string) => {
    if (!user) return;
    const targetId = activeRole === 'owner' ? activeRide?.driverId : activeRide?.ownerId;
    if (!targetId) return;

    const review: RatingReview = {
      id: 'rev_' + Date.now(),
      rideId,
      raterId: user.uid,
      raterRole: activeRole,
      targetUserId: targetId,
      score,
      note,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'ratings', review.id), review);
    } catch (e) {
      console.warn(e);
    }
  };

  const toggleDemoMode = () => {
    setIsDemoMode((prev) => !prev);
  };

  // Helper to step through demo flow on a single screen
  const advanceDemoTripStep = () => {
    if (!activeRide) return;
    if (activeRide.status === 'looking_for_driver') {
      const seed = SEED_DRIVERS[0];
      const updated: Ride = {
        ...activeRide,
        status: 'driver_assigned',
        driverId: seed.id,
        driverName: seed.name,
        driverPhone: seed.phone,
        driverPhoto: seed.photoUrl,
        driverRating: seed.rating,
        driverTripsCount: seed.tripsCompleted,
        driverLicenceVerified: true,
        etaMinutes: 5,
        driverLocation: { lat: seed.currentLat, lng: seed.currentLng },
        updatedAt: new Date().toISOString(),
      };
      setActiveRide(updated);
      setDoc(doc(db, 'rides', updated.id), cleanForFirestore(updated), { merge: true }).catch(() => {});
    } else if (activeRide.status === 'driver_assigned') {
      const updated: Ride = {
        ...activeRide,
        status: 'driver_en_route',
        etaMinutes: 2,
        updatedAt: new Date().toISOString(),
      };
      setActiveRide(updated);
      setDoc(doc(db, 'rides', updated.id), cleanForFirestore(updated), { merge: true }).catch(() => {});
    } else if (activeRide.status === 'driver_en_route') {
      const updated: Ride = {
        ...activeRide,
        status: 'driver_arrived',
        etaMinutes: 0,
        driverLocation: activeRide.pickupLocation,
        updatedAt: new Date().toISOString(),
      };
      setActiveRide(updated);
      setDoc(doc(db, 'rides', updated.id), cleanForFirestore(updated), { merge: true }).catch(() => {});
    } else if (activeRide.status === 'driver_arrived') {
      const updated: Ride = {
        ...activeRide,
        status: 'ride_active',
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setActiveRide(updated);
      setDoc(doc(db, 'rides', updated.id), cleanForFirestore(updated), { merge: true }).catch(() => {});
    } else if (activeRide.status === 'ride_active') {
      driverEndTrip(activeRide.id);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        activeRole,
        vehicles,
        selectedVehicle,
        driverProfile,
        activeRide,
        driverAvailableRides,
        rideHistory,
        subscriptions,
        activeSubscription,
        isDemoMode,
        isOnline,
        firestoreConnected,
        testFirestore,
        firebaseInfo,
        loading,
        signInPhone,
        signOutUser,
        switchRole,
        addVehicle,
        selectVehicle,
        updateDriverProfile,
        createBooking,
        cancelRide,
        driverAcceptRide,
        driverMarkEnRoute,
        driverMarkArrived,
        driverStartTrip,
        driverEndTrip,
        submitPayment,
        submitRating,
        createSubscriptionBooking,
        cancelSubscription,
        toggleDemoMode,
        advanceDemoTripStep,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
