export type UserRole = 'owner' | 'driver' | 'both';
export type ActiveRole = 'owner' | 'driver';

export interface UserProfile {
  uid: string;
  name: string;
  phone: string;
  role: UserRole;
  currentRole: ActiveRole;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type TransmissionType = 'manual' | 'automatic';
export type FuelType = 'petrol' | 'diesel' | 'cng' | 'ev';

export interface Vehicle {
  id: string;
  ownerId: string;
  make: string;
  model: string;
  year: number;
  registrationNumber: string;
  transmission: TransmissionType;
  fuelType: FuelType;
  createdAt: string;
  updatedAt: string;
}

export type DriverVerificationStatus = 'pending' | 'verified' | 'rejected';

export interface DriverProfile {
  driverId: string;
  name: string;
  phone: string;
  photoUrl: string;
  licenceNumber: string;
  licenceExpiry: string;
  experienceYears: number;
  vehicleTypes: ('manual' | 'automatic' | 'suv')[];
  serviceAreas: string[];
  verificationStatus: DriverVerificationStatus;
  isOnline: boolean;
  currentLat: number;
  currentLng: number;
  rating: number;
  tripsCompleted: number;
  totalEarnings: number;
  todayEarnings: number;
  weekEarnings: number;
  createdAt: string;
  updatedAt: string;
}

export interface NearbyDriver {
  id: string;
  name: string;
  phone?: string;
  photoUrl?: string;
  rating: number;
  tripsCount: number;
  experienceYears: number;
  vehicleModel: string;
  lat: number;
  lng: number;
  area: string;
}

export type RideStatus =
  | 'looking_for_driver'
  | 'driver_assigned'
  | 'driver_en_route'
  | 'driver_arrived'
  | 'ride_active'
  | 'completed'
  | 'cancelled_by_owner'
  | 'cancelled_by_driver'
  | 'expired';

export type TripType = 'commute' | 'evening_out' | 'outstation' | 'airport' | 'subscription';

export type SubscriptionPlanType = 'week' | 'month' | 'custom_days';
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type DailyDutyHours = 4 | 8 | 10 | 12;

export interface SubscriptionBooking {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  driverPhoto?: string;
  driverRating: number;
  driverExperienceYears: number;
  vehicleId: string;
  vehicleInfo: {
    make: string;
    model: string;
    year: number;
    registrationNumber: string;
    transmission: TransmissionType;
    fuelType: FuelType;
  };
  pickupLocation: LocationPoint;
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
  status: 'active' | 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  driverBrief?: {
    acPreference: 'full' | 'eco' | 'windows';
    musicPreference: 'silent' | 'low' | 'owner_choice';
    specialInstructions?: string;
  };
  createdAt: string;
}

export interface FareBreakdown {
  hourlyRate: number;
  hours: number;
  baseFare: number;
  nightSurcharge: number;
  outstationAllowance: number;
  platformFee: number;
  totalFare: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface LocationPoint {
  address: string;
  area: string;
  lat: number;
  lng: number;
}

export interface Ride {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  driverId?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  driverPhoto?: string | null;
  driverRating?: number;
  driverTripsCount?: number;
  driverLicenceVerified?: boolean;
  vehicleId: string;
  vehicleInfo: {
    make: string;
    model: string;
    year: number;
    registrationNumber: string;
    transmission: TransmissionType;
    fuelType: FuelType;
  };
  pickupLocation: LocationPoint;
  destinationLocation?: LocationPoint;
  tripType: TripType;
  startTime: string; // ISO string or time label
  durationHours: number;
  outstationDays?: number;
  fareEstimate: FareBreakdown;
  status: RideStatus;
  otp: string; // 4-digit code e.g. "4829"
  driverLocation?: LatLng & { heading?: number; updatedAt?: string };
  etaMinutes?: number;
  startedAt?: string;
  completedAt?: string;
  paymentStatus: 'pending' | 'paid';
  paymentMethod?: string;
  paymentReference?: string;
  driverBrief?: {
    acPreference: 'full' | 'eco' | 'windows';
    musicPreference: 'silent' | 'low' | 'owner_choice';
    avoidHighways?: boolean;
    noPhoneCalls?: boolean;
    specialInstructions?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface RatingReview {
  id: string;
  rideId: string;
  raterId: string;
  raterRole: 'owner' | 'driver';
  targetUserId: string;
  score: number; // 1 to 5
  note?: string;
  createdAt: string;
}

export interface KolkataPresetLocation {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
  landmark: string;
}
