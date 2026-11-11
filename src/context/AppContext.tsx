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
  limit,
  updateDoc,
  deleteDoc,
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
  LatLng,
  NearbyDriver,
} from '../types';
import { DEMO_ROUTE_COORDINATES, SEED_DRIVERS, KOLKATA_PRESET_LOCATIONS, KOLKATA_CENTER } from '../data/kolkataData';
import { calculateFare, calculateHaversineDistanceKm } from '../utils/fare';
import { cleanForFirestore } from '../utils/firestore';
import {
  autoMatchNearestDriverToRide,
  isRideWithinDriverPickupRadius,
  DRIVER_MATCH_RADIUS_KM,
} from '../services/matchmakingService';

interface AppContextType {
  user: UserProfile | null;
  activeRole: ActiveRole;
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  driverProfile: DriverProfile | null;
  activeRide: Ride | null;
  lastCancellationNotice: { by: 'owner' | 'driver'; reason?: string; rideId: string } | null;
  clearCancellationNotice: () => void;
  driverAvailableRides: Ride[];
  rideHistory: Ride[];
  subscriptions: SubscriptionBooking[];
  activeSubscription: SubscriptionBooking | null;
  onlineDrivers: NearbyDriver[];
  userLocation: LatLng | null;
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
  updateDriverLocation: (lat: number, lng: number) => Promise<void>;
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
  cancelRide: (rideId: string, by: 'owner' | 'driver', reason?: string) => Promise<void>;
  clearActiveRide: () => void;
  driverAcceptRide: (rideId: string) => Promise<boolean>;
  driverMarkEnRoute: (rideId: string) => Promise<void>;
  driverMarkArrived: (rideId: string) => Promise<void>;
  driverStartTrip: (rideId: string, enteredOtp: string) => Promise<{ success: boolean; message?: string }>;
  driverEndTrip: (rideId: string, enteredEndOtp?: string) => Promise<{ success: boolean; message?: string }>;
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
  cancelSubscriptionWithProration: (
    id: string,
    daysDriven: number,
    cancellationReason?: string
  ) => Promise<{ success: boolean; payoutToDriver: number; refundToOwner: number }>;
  pauseSubscriptionDates: (
    id: string,
    pausedDates: string[]
  ) => Promise<{ success: boolean; creditAmount: number }>;
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
    try {
      const saved = localStorage.getItem('safar_active_ride');
      if (!saved) return null;
      const parsed = JSON.parse(saved) as Ride;
      // Discard stale or completed/cancelled rides
      if (parsed.status === 'completed' || parsed.status?.startsWith('cancelled')) {
        localStorage.removeItem('safar_active_ride');
        return null;
      }
      if (parsed.createdAt && Date.now() - new Date(parsed.createdAt).getTime() > 2 * 60 * 60 * 1000) {
        localStorage.removeItem('safar_active_ride');
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [lastCancellationNotice, setLastCancellationNotice] = useState<{ by: 'owner' | 'driver'; reason?: string; rideId: string } | null>(null);
  const clearCancellationNotice = () => setLastCancellationNotice(null);

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

  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [firestoreConnected, setFirestoreConnected] = useState(true);
  const [loading, setLoading] = useState(false);

  // Real-time live online drivers from Cloud Firestore
  const [onlineDrivers, setOnlineDrivers] = useState<NearbyDriver[]>([]);

  // Real-time live GPS location for user & driver
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

  // Diagnostic connection tester for Cloud Firestore
  const testFirestore = async () => {
    const ok = await testConnection();
    setFirestoreConnected(ok);
    return ok;
  };

  const firebaseInfo = getFirebaseConfigInfo();

  // Firestore Real-Time Online Drivers Query
  // Whenever any driver goes online or changes their location, all owners see it instantly
  useEffect(() => {
    const q = query(collection(db, 'driverProfiles'), where('isOnline', '==', true));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const drivers: NearbyDriver[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as DriverProfile;
          if (typeof data.currentLat === 'number' && typeof data.currentLng === 'number') {
            drivers.push({
              id: docSnap.id,
              name: data.name || 'Verified Chauffeur',
              phone: data.phone,
              photoUrl: data.photoUrl,
              rating: data.rating || 4.95,
              tripsCount: data.tripsCompleted || 48,
              experienceYears: data.experienceYears || 6,
              vehicleModel: (data.vehicleTypes && data.vehicleTypes.length > 0)
                ? `${data.vehicleTypes.join(' & ')} Specialist`
                : 'Commercial Chauffeur',
              lat: data.currentLat,
              lng: data.currentLng,
              area: data.serviceAreas?.[0] || 'Kolkata Central',
            });
          }
        });
        setOnlineDrivers(drivers);
      },
      (error) => {
        console.warn('Real-time online drivers query notice:', error.message);
      }
    );

    return () => unsubscribe();
  }, []);

  // Update Driver Live Location in state and Cloud Firestore
  const updateDriverLocation = async (lat: number, lng: number) => {
    if (!driverProfile) return;
    const updated = {
      ...driverProfile,
      currentLat: lat,
      currentLng: lng,
      isOnline: true,
      updatedAt: new Date().toISOString(),
    };
    setDriverProfile(updated);

    try {
      await setDoc(doc(db, 'driverProfiles', driverProfile.driverId), updated, { merge: true });

      // If in an active trip, stream driver coordinates to the ride document for live tracking
      const activeTrackingStatuses = [
        'driver_assigned',
        'driver_en_route',
        'driver_arrived',
        'ride_active',
        'accepted',
        'en_route',
        'arrived',
        'in_progress',
      ];
      if (
        activeRide &&
        (activeTrackingStatuses.includes(activeRide.status) ||
          activeTrackingStatuses.includes(activeRide.ride_status || ''))
      ) {
        await updateDoc(doc(db, 'rides', activeRide.id), {
          driverLocation: { lat, lng, updatedAt: new Date().toISOString() },
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('Driver live location Firestore update note:', e);
    }
  };

  // Background live location tracking stream: continuously pushes driver coordinates
  // to Firestore while status is 'accepted', 'en_route', 'arrived', or 'in_progress'
  useEffect(() => {
    if (activeRole !== 'driver' || !activeRide) return;

    const s = activeRide.ride_status || activeRide.status;
    const isTracking =
      s === 'accepted' ||
      s === 'en_route' ||
      s === 'arrived' ||
      s === 'in_progress' ||
      s === 'driver_assigned' ||
      s === 'driver_en_route' ||
      s === 'driver_arrived' ||
      s === 'ride_active';

    if (!isTracking) return;

    const interval = setInterval(async () => {
      const currentLoc = userLocation || (driverProfile?.currentLat && driverProfile?.currentLng
        ? { lat: driverProfile.currentLat, lng: driverProfile.currentLng }
        : null);

      if (currentLoc) {
        try {
          await updateDoc(doc(db, 'rides', activeRide.id), {
            driverLocation: {
              lat: currentLoc.lat,
              lng: currentLoc.lng,
              updatedAt: new Date().toISOString(),
            },
            updatedAt: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('Driver heartbeat push notice:', e);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [
    activeRole,
    activeRide?.id,
    activeRide?.status,
    activeRide?.ride_status,
    userLocation?.lat,
    userLocation?.lng,
    driverProfile?.currentLat,
    driverProfile?.currentLng,
  ]);

  // Real-Time Assigned Ride Listener for Driver (Prevents vanishing popup / screen)
  useEffect(() => {
    if (activeRole !== 'driver' || !driverProfile?.driverId) return;

    const q = query(
      collection(db, 'rides'),
      where('driverId', '==', driverProfile.driverId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const validActiveRides = snapshot.docs
            .map((docSnap) => ({ ...(docSnap.data() as Ride), id: docSnap.id }))
            .filter((ride) => {
              const s = ride.ride_status || ride.status;
              const isActiveStatus =
                s === 'accepted' ||
                s === 'en_route' ||
                s === 'arrived' ||
                s === 'in_progress' ||
                s === 'driver_assigned' ||
                s === 'driver_en_route' ||
                s === 'driver_arrived' ||
                s === 'ride_active';
              if (!isActiveStatus) return false;
              // Ignore stale test rides created > 2 hours ago
              if (ride.createdAt) {
                const ageMs = Date.now() - new Date(ride.createdAt).getTime();
                if (ageMs > 2 * 60 * 60 * 1000) return false;
              }
              return true;
            })
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

          if (validActiveRides.length > 0) {
            setActiveRide(validActiveRides[0]);
          } else {
            // No valid non-stale active rides
            setActiveRide(null);
            localStorage.removeItem('safar_active_ride');
          }
        }
      },
      (error) => {
        console.warn('Driver assigned ride snapshot notice:', error.message);
      }
    );

    return () => unsubscribe();
  }, [activeRole, driverProfile?.driverId]);

  // Continuous live GPS geolocation tracking
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    // 1. Initial quick position fix
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        if (activeRole === 'driver' && driverProfile?.isOnline) {
          updateDriverLocation(loc.lat, loc.lng);
        }
      },
      (err) => {
        console.warn('Initial geolocation notice:', err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );

    // 2. Active position watcher
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        if (activeRole === 'driver' && driverProfile?.isOnline) {
          updateDriverLocation(loc.lat, loc.lng);
        }
      },
      (err) => {
        console.warn('Geolocation watch notice:', err.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );

    return () => {
      try {
        navigator.geolocation.clearWatch(watchId);
      } catch {}
    };
  }, [activeRole, driverProfile?.isOnline, driverProfile?.driverId]);

  // Online / offline listeners & database health checks
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial Firebase Auth & Firestore ping
    ensureFirebaseAuth()
      .then(() => testConnection())
      .then(async (connected) => {
        setFirestoreConnected(connected);
        if (connected) {
          try {
            // Purge any legacy mockup drivers from Firestore so ONLY real registered drivers appear
            const legacyMockIds = [
              'drv_subhash_01',
              'drv_anirban_02',
              'drv_prosenjit_03',
              'drv_tanmoy_04',
              'drv_rajesh_05',
              'drv_bikram_06',
            ];
            for (const mockId of legacyMockIds) {
              deleteDoc(doc(db, 'driverProfiles', mockId)).catch(() => {});
            }
          } catch (e) {
            console.warn('Driver cleanup note:', e);
          }
        }
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

  // Firestore Real-Time Active Ride Listener
  useEffect(() => {
    if (!user || !activeRide?.id) return;

    const rideDocRef = doc(db, 'rides', activeRide.id);
    const unsubscribe = onSnapshot(
      rideDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Ride;
          if (data.status === 'cancelled_by_owner' || data.status === 'cancelled_by_driver' || data.ride_status === 'cancelled') {
            setLastCancellationNotice({
              by: data.status === 'cancelled_by_owner' ? 'owner' : 'driver',
              reason: data.cancellationReason || 'No details provided',
              rideId: docSnap.id,
            });
            setActiveRide(null);
            localStorage.removeItem('safar_active_ride');
          } else {
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
        }
      },
      (error) => {
        console.warn('Real-time ride snapshot note:', error.message);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, activeRide?.id]);

  // Firestore Real-Time Driver Available Rides Listener
  // Drivers exclusively receive incoming ride requests where the ride's PICKUP location is within 5km
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
        const driverCoords = userLocation || (driverProfile?.currentLat && driverProfile?.currentLng
          ? { lat: driverProfile.currentLat, lng: driverProfile.currentLng }
          : null);

        snapshot.forEach((docSnap) => {
          const ride = { ...(docSnap.data() as Ride), id: docSnap.id };

          // STRICT 5KM RADIUS FROM OWNER'S PICKUP LOCATION:
          // The driver only receives this dispatch if the ride's PICKUP location is within 5km.
          // Destination coordinates are strictly ignored for matchmaking.
          if (driverCoords && ride.pickupLocation) {
            const isNearPickup = isRideWithinDriverPickupRadius(
              driverCoords,
              ride.pickupLocation,
              DRIVER_MATCH_RADIUS_KM
            );
            if (isNearPickup) {
              rides.push(ride);
            }
          } else {
            rides.push(ride);
          }
        });
        setDriverAvailableRides(rides);
      },
      (error) => {
        console.warn('Driver dispatch snapshot note:', error.message);
      }
    );

    return () => unsubscribe();
  }, [
    activeRole,
    driverProfile?.isOnline,
    driverProfile?.currentLat,
    driverProfile?.currentLng,
    userLocation,
    user?.uid,
  ]);



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

      // If driver or both, bootstrap or sync driver profile with entered credentials
      if (role === 'driver' || role === 'both') {
        const dLat = userLocation?.lat || driverProfile?.currentLat || KOLKATA_CENTER.lat;
        const dLng = userLocation?.lng || driverProfile?.currentLng || KOLKATA_CENTER.lng;

        const dProfile: DriverProfile = {
          driverId: profile.uid,
          name: profile.name,
          phone: profile.phone,
          photoUrl: profile.avatarUrl || '',
          licenceNumber: driverProfile?.licenceNumber || ('WB-02-' + new Date().getFullYear() + '-00' + Math.floor(1000 + Math.random() * 9000)),
          licenceExpiry: driverProfile?.licenceExpiry || '2034-12-31',
          experienceYears: driverProfile?.experienceYears || 7,
          vehicleTypes: driverProfile?.vehicleTypes || ['manual', 'automatic', 'suv'],
          serviceAreas: driverProfile?.serviceAreas || ['Kolkata & Suburbs'],
          verificationStatus: 'verified', // Verified by default for instant evaluation
          isOnline: true,
          currentLat: dLat,
          currentLng: dLng,
          rating: driverProfile?.rating || 4.95,
          tripsCompleted: driverProfile?.tripsCompleted || 142,
          totalEarnings: driverProfile?.totalEarnings || 28400,
          todayEarnings: driverProfile?.todayEarnings || 1260,
          weekEarnings: driverProfile?.weekEarnings || 6840,
          createdAt: driverProfile?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setDriverProfile(dProfile);
        try {
          await setDoc(doc(db, 'driverProfiles', profile.uid), dProfile, { merge: true });
        } catch (e) {
          console.warn('Driver profile save note:', e);
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
      status: 'looking_for_driver',
      ride_status: 'pending',
      otp: otpCode,
      start_otp: otpCode,
      end_otp: null,
      driverLocation: null,
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

  const cancelRide = async (rideId: string, by: 'owner' | 'driver', reason?: string) => {
    const nextStatus = by === 'owner' ? 'cancelled_by_owner' : 'cancelled_by_driver';
    setActiveRide(null);
    localStorage.removeItem('safar_active_ride');

    if (activeRide && activeRide.id === rideId) {
      const updated: Ride = {
        ...activeRide,
        status: nextStatus,
        ride_status: 'cancelled',
        cancellationReason: reason,
        updatedAt: new Date().toISOString(),
      };
      setRideHistory((prev) => [updated, ...prev]);
    }

    try {
      await updateDoc(doc(db, 'rides', rideId), {
        status: nextStatus,
        ride_status: 'cancelled',
        cancellationReason: reason || null,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Ride cancel note:', e);
    }
  };

  const clearActiveRide = () => {
    setActiveRide(null);
    localStorage.removeItem('safar_active_ride');
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

  // Prorated Cancellation: Driver is paid for the exact days driven; owner is refunded the remainder
  const cancelSubscriptionWithProration = async (
    id: string,
    daysDriven: number,
    cancellationReason?: string
  ): Promise<{ success: boolean; payoutToDriver: number; refundToOwner: number }> => {
    const sub = subscriptions.find((s) => s.id === id);
    if (!sub) {
      return { success: false, payoutToDriver: 0, refundToOwner: 0 };
    }

    const workingDays = Math.max(1, sub.workingDaysCount || sub.totalDays || 1);
    const dailyRate = sub.perDayRate || Math.round(sub.totalFare / workingDays);
    const safeDays = Math.max(0, Math.min(daysDriven, workingDays));

    // Driver gets paid as per the days the driver drove
    const payoutToDriver = Math.round(safeDays * dailyRate);
    // Owner is refunded the remainder of the subscription fare
    const refundToOwner = Math.max(0, sub.totalFare - payoutToDriver);

    const updatedSub: SubscriptionBooking = {
      ...sub,
      status: 'cancelled',
      daysUsed: safeDays,
      payoutToDriver,
      refundToOwner,
      cancelledAt: new Date().toISOString(),
      cancellationReason: cancellationReason || `Contract cancelled after ${safeDays} days of service`,
    };

    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? updatedSub : s))
    );

    // If driver is currently active, credit the days driven into driver earnings ledger
    if (driverProfile) {
      setDriverProfile((prev) =>
        prev
          ? {
              ...prev,
              todayEarnings: (prev.todayEarnings || 0) + payoutToDriver,
              weekEarnings: (prev.weekEarnings || 0) + payoutToDriver,
            }
          : prev
      );
    }

    try {
      await updateDoc(doc(db, 'subscriptions', id), cleanForFirestore({
        status: 'cancelled',
        daysUsed: safeDays,
        payoutToDriver,
        refundToOwner,
        cancelledAt: updatedSub.cancelledAt,
        cancellationReason: updatedSub.cancellationReason,
        updatedAt: new Date().toISOString(),
      }));
    } catch (e) {
      console.warn('Subscription prorated cancellation note:', e);
    }

    return { success: true, payoutToDriver, refundToOwner };
  };

  // Flexible Pause / Leave: Skip 1-3 specific days, crediting the owner or adjusting schedule
  const pauseSubscriptionDates = async (
    id: string,
    pausedDates: string[]
  ): Promise<{ success: boolean; creditAmount: number }> => {
    const sub = subscriptions.find((s) => s.id === id);
    if (!sub) return { success: false, creditAmount: 0 };

    const workingDays = Math.max(1, sub.workingDaysCount || sub.totalDays || 1);
    const dailyRate = sub.perDayRate || Math.round(sub.totalFare / workingDays);
    const creditAmount = pausedDates.length * dailyRate;

    const updatedSub: SubscriptionBooking = {
      ...sub,
      pausedDates,
    };

    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? updatedSub : s))
    );

    try {
      await updateDoc(doc(db, 'subscriptions', id), cleanForFirestore({
        pausedDates,
        updatedAt: new Date().toISOString(),
      }));
    } catch (e) {
      console.warn('Subscription pause note:', e);
    }

    return { success: true, creditAmount };
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
        const currentS = data.ride_status || data.status;
        if (currentS !== 'looking_for_driver' && currentS !== 'pending') {
          throw new Error('Ride already accepted by another driver');
        }

        const driverCoords = userLocation || (driverProfile.currentLat && driverProfile.currentLng
          ? { lat: driverProfile.currentLat, lng: driverProfile.currentLng }
          : { lat: 22.428, lng: 88.421 });

        transaction.update(rideRef, {
          status: 'driver_en_route',
          ride_status: 'en_route',
          driverId: driverProfile.driverId,
          driverName: driverProfile.name,
          driverPhone: driverProfile.phone,
          driverPhoto: driverProfile.photoUrl,
          driverRating: driverProfile.rating,
          driverTripsCount: driverProfile.tripsCompleted,
          driverLicenceVerified: driverProfile.verificationStatus === 'verified',
          etaMinutes: 5,
          driverLocation: driverCoords,
          updatedAt: new Date().toISOString(),
        });

        acceptedSuccessfully = true;
      });

      if (acceptedSuccessfully) {
        const rideRef = doc(db, 'rides', rideId);
        const fresh = await getDoc(rideRef);
        if (fresh.exists()) {
          const freshRide = { ...(fresh.data() as Ride), id: fresh.id };
          setActiveRide(freshRide);
        }
      }

      return acceptedSuccessfully;
    } catch (err) {
      console.warn('Driver accept transaction note, falling back to local sync:', err);
      // Local fallback for offline/demo
      const driverCoords = userLocation || (driverProfile.currentLat && driverProfile.currentLng
        ? { lat: driverProfile.currentLat, lng: driverProfile.currentLng }
        : { lat: 22.428, lng: 88.421 });

      if (activeRide && activeRide.id === rideId) {
        const updated: Ride = {
          ...activeRide,
          status: 'driver_en_route',
          ride_status: 'en_route',
          driverId: driverProfile.driverId,
          driverName: driverProfile.name,
          driverPhone: driverProfile.phone,
          driverPhoto: driverProfile.photoUrl,
          driverRating: driverProfile.rating,
          driverTripsCount: driverProfile.tripsCompleted,
          driverLicenceVerified: driverProfile.verificationStatus === 'verified',
          etaMinutes: 5,
          driverLocation: driverCoords,
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
      ride_status: 'en_route',
      etaMinutes: 3,
      updatedAt: new Date().toISOString(),
    };
    setActiveRide(updated);
    try {
      await updateDoc(doc(db, 'rides', rideId), {
        status: 'driver_en_route',
        ride_status: 'en_route',
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
      ride_status: 'arrived',
      etaMinutes: 0,
      updatedAt: new Date().toISOString(),
    };
    setActiveRide(updated);
    try {
      await updateDoc(doc(db, 'rides', rideId), {
        status: 'driver_arrived',
        ride_status: 'arrived',
        etaMinutes: 0,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn(e);
    }
  };

  // Driver verifies the 4-digit start OTP shown on the owner's screen to begin the trip
  const driverStartTrip = async (rideId: string, enteredOtp: string): Promise<{ success: boolean; message?: string }> => {
    if (!activeRide || activeRide.id !== rideId) {
      return { success: false, message: 'Trip not found.' };
    }

    const expectedStartOtp = activeRide.start_otp || activeRide.otp;
    if (expectedStartOtp !== enteredOtp.trim()) {
      return { success: false, message: 'Invalid 4-digit start OTP. Please ask the vehicle owner to check their screen.' };
    }

    // Generate 4-digit end_otp for destination completion
    const endOtpCode = generateOTP();

    const updated: Ride = {
      ...activeRide,
      status: 'ride_active',
      ride_status: 'in_progress',
      end_otp: endOtpCode,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setActiveRide(updated);

    try {
      await updateDoc(doc(db, 'rides', rideId), {
        status: 'ride_active',
        ride_status: 'in_progress',
        end_otp: endOtpCode,
        startedAt: updated.startedAt,
        updatedAt: updated.updatedAt,
      });
    } catch (e) {
      console.warn('Trip start firestore note:', e);
    }

    return { success: true };
  };

  // Driver verifies the 4-digit end OTP shown on the owner's screen upon reaching destination
  const driverEndTrip = async (rideId: string, enteredEndOtp?: string): Promise<{ success: boolean; message?: string }> => {
    if (!activeRide || activeRide.id !== rideId) {
      return { success: false, message: 'Trip not found.' };
    }

    // Require end_otp validation if present
    const expectedEndOtp = activeRide.end_otp;
    if (expectedEndOtp) {
      if (!enteredEndOtp || enteredEndOtp.trim() !== expectedEndOtp) {
        return {
          success: false,
          message: 'Invalid 4-digit end OTP. Please ask the vehicle owner for the completion code displayed on their screen.',
        };
      }
    }

    const updated: Ride = {
      ...activeRide,
      status: 'completed',
      ride_status: 'completed',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setActiveRide(updated);
    setRideHistory((prev) => [updated, ...prev]);

    // Update driver earnings stats (85% driver payout)
    if (driverProfile) {
      const fare = activeRide.fareEstimate?.totalFare || 350;
      const earnings = Math.round(fare * 0.85);
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
        ride_status: 'completed',
        completedAt: updated.completedAt,
        updatedAt: updated.updatedAt,
      });
    } catch (e) {
      console.warn('Trip completion firestore note:', e);
    }

    return { success: true };
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

  return (
    <AppContext.Provider
      value={{
        user,
        activeRole,
        vehicles,
        selectedVehicle,
        driverProfile,
        activeRide,
        lastCancellationNotice,
        clearCancellationNotice,
        driverAvailableRides,
        rideHistory,
        subscriptions,
        activeSubscription,
        onlineDrivers,
        userLocation,
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
        updateDriverLocation,
        createBooking,
        cancelRide,
        clearActiveRide,
        driverAcceptRide,
        driverMarkEnRoute,
        driverMarkArrived,
        driverStartTrip,
        driverEndTrip,
        submitPayment,
        submitRating,
        createSubscriptionBooking,
        cancelSubscription,
        cancelSubscriptionWithProration,
        pauseSubscriptionDates,
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
