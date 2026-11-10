import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  UserProfile,
  Vehicle,
  DriverProfile,
  Ride,
  SubscriptionBooking,
  RatingReview,
} from '../types';

/**
 * Retrieves the Supabase URL & Anon Key from Environment or LocalStorage.
 * This allows both zero-config env loading and in-app interactive credential input.
 */
export function getSupabaseConfig(): { url: string; anonKey: string } {
  const metaEnv = (import.meta as any).env || {};
  let url = (
    metaEnv.VITE_SUPABASE_URL ||
    metaEnv.SUPABASE_URL ||
    ''
  ).trim();

  let anonKey = (
    metaEnv.VITE_SUPABASE_ANON_KEY ||
    metaEnv.SUPABASE_ANON_KEY ||
    ''
  ).trim();

  // Allow live override from browser LocalStorage
  try {
    const savedUrl = localStorage.getItem('safar_supabase_url');
    const savedKey = localStorage.getItem('safar_supabase_anon_key');
    if (savedUrl && savedUrl.trim()) url = savedUrl.trim();
    if (savedKey && savedKey.trim()) anonKey = savedKey.trim();
  } catch {}

  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(
    url &&
    anonKey &&
    url.startsWith('https://') &&
    url.includes('.supabase.co') &&
    anonKey.length > 20
  );
}

export function setSupabaseConfig(url: string, anonKey: string): void {
  try {
    if (url && anonKey) {
      localStorage.setItem('safar_supabase_url', url.trim());
      localStorage.setItem('safar_supabase_anon_key', anonKey.trim());
    } else {
      localStorage.removeItem('safar_supabase_url');
      localStorage.removeItem('safar_supabase_anon_key');
    }
    // Re-initialize client
    _supabaseClient = null;
    window.dispatchEvent(new CustomEvent('supabase-config-changed'));
  } catch (e) {
    console.warn('Could not save Supabase configuration to storage:', e);
  }
}

let _supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (_supabaseClient) return _supabaseClient;
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey || !isSupabaseConfigured()) {
    return null;
  }
  try {
    _supabaseClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    return _supabaseClient;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}

/**
 * Health check & diagnostic function to test the Supabase connection.
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  latencyMs?: number;
}> {
  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      message: 'Supabase URL or Anon key is not configured. Please enter them in Settings.',
    };
  }

  const start = performance.now();
  try {
    // Attempt a lightweight query on profiles table or get server timestamp
    const { error } = await client.from('profiles').select('id', { count: 'exact', head: true });
    const latency = Math.round(performance.now() - start);

    if (error) {
      // If table doesn't exist yet, it's connected to Supabase but needs schema execution
      if (error.code === '42P01') {
        return {
          success: true,
          message: `Connected to Supabase (${latency}ms)! However, tables are missing. Please execute supabase-schema.sql in your Supabase SQL Editor.`,
          latencyMs: latency,
        };
      }
      return {
        success: false,
        message: `Supabase error: ${error.message} (code: ${error.code})`,
        latencyMs: latency,
      };
    }

    return {
      success: true,
      message: `Successfully connected to Supabase Database & Realtime (${latency}ms latency)!`,
      latencyMs: latency,
    };
  } catch (e: any) {
    return {
      success: false,
      message: e?.message || 'Network error connecting to Supabase host.',
    };
  }
}

/* =========================================================================
 * Typed Supabase Database Sync Operations
 * ========================================================================= */

export async function syncUserProfileToSupabase(user: UserProfile): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('profiles').upsert(
      {
        id: user.uid,
        name: user.name,
        phone: user.phone,
        role: user.role,
        current_role: user.currentRole,
        avatar_url: user.avatarUrl || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    if (error) console.warn('Supabase profile sync error:', error.message);
    return !error;
  } catch (e) {
    console.warn('Supabase syncUserProfile error:', e);
    return false;
  }
}

export async function syncVehicleToSupabase(vehicle: Vehicle): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('vehicles').upsert(
      {
        id: vehicle.id,
        owner_id: vehicle.ownerId,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        registration_number: vehicle.registrationNumber,
        transmission: vehicle.transmission,
        fuel_type: vehicle.fuelType,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    if (error) console.warn('Supabase vehicle sync error:', error.message);
    return !error;
  } catch (e) {
    console.warn('Supabase syncVehicle error:', e);
    return false;
  }
}

export async function fetchVehiclesFromSupabase(ownerId: string): Promise<Vehicle[] | null> {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('vehicles')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error || !data) return null;

    return data.map((row: any) => ({
      id: row.id,
      ownerId: row.owner_id,
      make: row.make,
      model: row.model,
      year: row.year,
      registrationNumber: row.registration_number,
      transmission: row.transmission,
      fuelType: row.fuel_type,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (e) {
    console.warn('Supabase fetchVehicles error:', e);
    return null;
  }
}

export async function syncDriverProfileToSupabase(profile: DriverProfile): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('driver_profiles').upsert(
      {
        driver_id: profile.driverId,
        name: profile.name,
        phone: profile.phone,
        photo_url: profile.photoUrl || null,
        licence_number: profile.licenceNumber,
        licence_expiry: profile.licenceExpiry,
        experience_years: profile.experienceYears,
        vehicle_types: profile.vehicleTypes,
        service_areas: profile.serviceAreas,
        verification_status: profile.verificationStatus,
        is_online: profile.isOnline,
        current_lat: profile.currentLat,
        current_lng: profile.currentLng,
        rating: profile.rating,
        trips_completed: profile.tripsCompleted,
        total_earnings: profile.totalEarnings,
        today_earnings: profile.todayEarnings,
        week_earnings: profile.weekEarnings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'driver_id' }
    );
    if (error) console.warn('Supabase driver profile sync error:', error.message);
    return !error;
  } catch (e) {
    console.warn('Supabase syncDriverProfile error:', e);
    return false;
  }
}

export async function syncRideToSupabase(ride: Ride): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const payload = {
      id: ride.id,
      owner_id: ride.ownerId,
      owner_name: ride.ownerName,
      owner_phone: ride.ownerPhone,
      driver_id: ride.driverId || null,
      driver_name: ride.driverName || null,
      driver_phone: ride.driverPhone || null,
      driver_photo: ride.driverPhoto || null,
      driver_rating: ride.driverRating || null,
      driver_trips_count: ride.driverTripsCount || null,
      driver_licence_verified: ride.driverLicenceVerified ?? null,
      vehicle_id: ride.vehicleId,
      vehicle_info: ride.vehicleInfo,
      pickup_location: ride.pickupLocation,
      destination_location: ride.destinationLocation || null,
      trip_type: ride.tripType,
      start_time: ride.startTime,
      duration_hours: ride.durationHours,
      outstation_days: ride.outstationDays || null,
      fare_estimate: ride.fareEstimate,
      status: ride.status,
      otp: ride.otp,
      driver_location: ride.driverLocation || null,
      eta_minutes: ride.etaMinutes || null,
      started_at: ride.startedAt || null,
      completed_at: ride.completedAt || null,
      payment_status: ride.paymentStatus,
      payment_method: ride.paymentMethod || null,
      payment_reference: ride.paymentReference || null,
      driver_brief: ride.driverBrief || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('rides').upsert(payload, { onConflict: 'id' });
    if (error) console.warn('Supabase ride sync error:', error.message);
    return !error;
  } catch (e) {
    console.warn('Supabase syncRide error:', e);
    return false;
  }
}

export async function syncSubscriptionToSupabase(sub: SubscriptionBooking): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const payload = {
      id: sub.id,
      owner_id: sub.ownerId,
      owner_name: sub.ownerName,
      owner_phone: sub.ownerPhone,
      driver_id: sub.driverId,
      driver_name: sub.driverName,
      driver_phone: sub.driverPhone,
      driver_photo: sub.driverPhoto || null,
      driver_rating: sub.driverRating,
      driver_experience_years: sub.driverExperienceYears,
      vehicle_id: sub.vehicleId,
      vehicle_info: sub.vehicleInfo,
      pickup_location: sub.pickupLocation,
      plan_type: sub.planType,
      selected_days: sub.selectedDays,
      start_date: sub.startDate,
      end_date: sub.endDate,
      total_days: sub.totalDays,
      working_days_count: sub.workingDaysCount,
      daily_duty_hours: sub.dailyDutyHours,
      daily_start_time: sub.dailyStartTime,
      per_day_rate: sub.perDayRate,
      discount_percent: sub.discountPercent,
      subtotal: sub.subtotal,
      savings: sub.savings,
      total_fare: sub.totalFare,
      status: sub.status,
      notes: sub.notes || null,
      driver_brief: sub.driverBrief || null,
    };

    const { error } = await client.from('subscriptions').upsert(payload, { onConflict: 'id' });
    if (error) console.warn('Supabase subscription sync error:', error.message);
    return !error;
  } catch (e) {
    console.warn('Supabase syncSubscription error:', e);
    return false;
  }
}

export async function syncRatingToSupabase(review: RatingReview): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('ratings').insert({
      id: review.id,
      ride_id: review.rideId,
      rater_id: review.raterId,
      rater_role: review.raterRole,
      target_user_id: review.targetUserId,
      score: review.score,
      note: review.note || null,
    });
    return !error;
  } catch (e) {
    console.warn('Supabase syncRating error:', e);
    return false;
  }
}
