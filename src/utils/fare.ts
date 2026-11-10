import { FareBreakdown, TripType } from '../types';

export const HOURLY_RATE = 180; // ₹180 per hour base
export const NIGHT_SURCHARGE_FLAT = 250; // Night surcharge for 10 PM - 6 AM
export const OUTSTATION_DAILY_ALLOWANCE = 500; // Daily allowance for outstation trips
export const PLATFORM_FEE = 40;

export function calculateFare(params: {
  tripType: TripType;
  durationHours: number;
  startTime?: string; // e.g. "2026-11-07T22:30" or time string
  outstationDays?: number;
}): FareBreakdown {
  const { tripType, durationHours, startTime, outstationDays = 1 } = params;

  const baseFare = durationHours * HOURLY_RATE;

  // Check if trip touches 10 PM (22:00) to 6 AM (06:00)
  let nightSurcharge = 0;
  if (startTime) {
    const date = new Date(startTime);
    const hour = !isNaN(date.getTime()) ? date.getHours() : new Date().getHours();
    if (hour >= 22 || hour < 6 || tripType === 'evening_out') {
      nightSurcharge = NIGHT_SURCHARGE_FLAT;
    }
  } else if (tripType === 'evening_out') {
    nightSurcharge = NIGHT_SURCHARGE_FLAT;
  }

  // Outstation daily allowance
  const outstationAllowance =
    tripType === 'outstation' ? Math.max(1, outstationDays) * OUTSTATION_DAILY_ALLOWANCE : 0;

  const totalFare = baseFare + nightSurcharge + outstationAllowance + PLATFORM_FEE;

  return {
    hourlyRate: HOURLY_RATE,
    hours: durationHours,
    baseFare,
    nightSurcharge,
    outstationAllowance,
    platformFee: PLATFORM_FEE,
    totalFare,
  };
}

/**
 * Calculate Haversine great-circle distance between two GPS coordinates in kilometers
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimate realistic Kolkata road driving distance (road curvature factor ~1.28)
 */
export function estimateRoadDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const straightLine = calculateHaversineDistanceKm(lat1, lon1, lat2, lon2);
  // Urban road factor in Kolkata varies between 1.25x - 1.35x
  const roadKm = Math.max(1.2, straightLine * 1.28);
  return Math.round(roadKm * 10) / 10;
}

/**
 * Estimate traffic-aware drive duration in minutes based on distance
 */
export function estimateDriveDurationMinutes(distanceKm: number, isNight = false): number {
  // Average Kolkata urban speed ~22 km/h daytime, ~32 km/h night
  const avgSpeed = isNight ? 32 : 22;
  const mins = Math.round((distanceKm / avgSpeed) * 60) + 5; // +5 mins signal/junction buffer
  return Math.max(12, mins);
}

export interface TripEstimateResult {
  distanceKm: number;
  driveDurationMinutes: number;
  recommendedHours: number;
  driverFee: number;
  nightSurcharge: number;
  outstationAllowance: number;
  platformFee: number;
  totalDriverFare: number;
  estimatedFuelCost: number;
  totalTripExpense: number;
  estimatedCabRentalCost: number;
  estimatedSavings: number;
}

/**
 * Calculates a complete trip estimate based on distance, duration, and trip type
 */
export function calculateTripEstimate(params: {
  distanceKm: number;
  durationHours: number;
  tripType: TripType;
  isNight?: boolean;
  outstationDays?: number;
}): TripEstimateResult {
  const { distanceKm, durationHours, tripType, isNight = false, outstationDays = 1 } = params;

  const driveDurationMinutes = estimateDriveDurationMinutes(distanceKm, isNight);

  // Recommended booking duration based on round-trip / stopover time
  const minRequiredHours = Math.max(1, Math.ceil((driveDurationMinutes * 2) / 60));
  const effectiveHours = Math.max(durationHours, minRequiredHours);

  const driverFee = effectiveHours * HOURLY_RATE;
  const nightSurcharge = (isNight || tripType === 'evening_out') ? NIGHT_SURCHARGE_FLAT : 0;
  const outstationAllowance = tripType === 'outstation' ? Math.max(1, outstationDays) * OUTSTATION_DAILY_ALLOWANCE : 0;
  const platformFee = PLATFORM_FEE;

  const totalDriverFare = driverFee + nightSurcharge + outstationAllowance + platformFee;

  // Approximate fuel cost in personal car (~12 km/L petrol at ₹106/L in Kolkata ≈ ₹8.8/km)
  // Assuming round trip or full day mobility (approx 1.8x one-way distance)
  const totalDrivingKm = tripType === 'commute' || tripType === 'airport' ? distanceKm * 1.5 : distanceKm * 2;
  const estimatedFuelCost = Math.round(totalDrivingKm * 8.8);

  const totalTripExpense = totalDriverFare + estimatedFuelCost;

  // Equivalent private cab / commercial rental cost in Kolkata
  const estimatedCabRentalCost = Math.round(
    tripType === 'outstation'
      ? outstationDays * 3200
      : effectiveHours * 360 + distanceKm * 16
  );

  const estimatedSavings = Math.max(0, estimatedCabRentalCost - totalTripExpense);

  return {
    distanceKm,
    driveDurationMinutes,
    recommendedHours: effectiveHours,
    driverFee,
    nightSurcharge,
    outstationAllowance,
    platformFee,
    totalDriverFare,
    estimatedFuelCost,
    totalTripExpense,
    estimatedCabRentalCost,
    estimatedSavings,
  };
}

/**
 * Format Indian Rupees with standard lakh/crore commas (e.g. ₹1,450)
 */
export function formatRupee(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format time in 12-hour IST format (e.g. "04:30 PM IST")
 */
export function formatTimeIST(dateInput: Date | string | number): string {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }) + ' IST';
}

/**
 * Format date in readable Indian format (e.g. "07 Nov 2026")
 */
export function formatDateIN(dateInput: Date | string | number): string {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

// ----------------------------------------------------
// SUBSCRIPTION / RECURRING CHAUFFEUR FARE CALCULATIONS
// ----------------------------------------------------

export const DAILY_CHAUFFEUR_RATES: Record<number, number> = {
  4: 580,  // ₹580/day for half-day (4 hrs)
  8: 950,  // ₹950/day for standard office duty (8 hrs)
  10: 1150, // ₹1,150/day for extended shift (10 hrs)
  12: 1350, // ₹1,350/day for executive full-day (12 hrs)
};

export const DAY_CONFIG: Record<string, { label: string; short: string; dayIndex: number }> = {
  mon: { label: 'Monday', short: 'Mon', dayIndex: 1 },
  tue: { label: 'Tuesday', short: 'Tue', dayIndex: 2 },
  wed: { label: 'Wednesday', short: 'Wed', dayIndex: 3 },
  thu: { label: 'Thursday', short: 'Thu', dayIndex: 4 },
  fri: { label: 'Friday', short: 'Fri', dayIndex: 5 },
  sat: { label: 'Saturday', short: 'Sat', dayIndex: 6 },
  sun: { label: 'Sunday', short: 'Sun', dayIndex: 0 },
};

export const PRESET_MON_TO_FRI = ['mon', 'tue', 'wed', 'thu', 'fri'] as const;
export const PRESET_ALL_WEEK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export interface SubscriptionQuoteResult {
  dailyRate: number;
  workingDaysCount: number;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  insuranceAndSupportFee: number;
  totalFare: number;
  equivalentHourlyCost: number;
  savingsVsHourly: number;
}

export function calculateSubscriptionQuote(params: {
  planType: 'week' | 'month' | 'custom_days';
  selectedDays: string[];
  dailyDutyHours: number;
  weeksCount?: number;
  monthsCount?: number;
}): SubscriptionQuoteResult {
  const {
    planType,
    selectedDays,
    dailyDutyHours,
    weeksCount = 1,
    monthsCount = 1,
  } = params;

  const baseDailyRate = DAILY_CHAUFFEUR_RATES[dailyDutyHours] || 950;
  const daysPerWeek = Math.max(1, selectedDays.length);

  let workingDaysCount = 0;
  let discountPercent = 0;

  if (planType === 'week') {
    workingDaysCount = daysPerWeek * weeksCount;
    discountPercent = 12; // 12% weekly package discount
  } else if (planType === 'month') {
    // Average 4.33 weeks per month
    workingDaysCount = Math.round(daysPerWeek * 4.33 * monthsCount);
    discountPercent = 22; // 22% monthly package discount
  } else {
    // Custom days
    workingDaysCount = daysPerWeek * weeksCount;
    discountPercent = workingDaysCount >= 20 ? 20 : workingDaysCount >= 5 ? 12 : 5;
  }

  const subtotal = workingDaysCount * baseDailyRate;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const insuranceAndSupportFee = Math.round(workingDaysCount * 25); // ₹25/day verified chauffeur cover & backup replacement
  const totalFare = subtotal - discountAmount + insuranceAndSupportFee;

  // Comparison against regular on-demand hourly rates (₹180/hr)
  const equivalentHourlyCost = workingDaysCount * dailyDutyHours * HOURLY_RATE;
  const savingsVsHourly = Math.max(0, equivalentHourlyCost - totalFare);

  return {
    dailyRate: baseDailyRate,
    workingDaysCount,
    subtotal,
    discountPercent,
    discountAmount,
    insuranceAndSupportFee,
    totalFare,
    equivalentHourlyCost,
    savingsVsHourly,
  };
}
