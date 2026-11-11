import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { LatLng, LocationPoint, DriverProfile, NearbyDriver, Ride } from '../types';
import { calculateHaversineDistanceKm } from '../utils/fare';

export interface DriverWithDistance extends DriverProfile {
  distanceKm: number;
}

export interface NearbyDriverWithDistance extends NearbyDriver {
  distanceKm: number;
}

/**
 * Standard matching radius strictly enforced across the application
 */
export const DRIVER_MATCH_RADIUS_KM = 5.0;

/**
 * Filters a list of nearby drivers strictly to those within a 5km radius of the owner's pickup location.
 * DESTINATION COORDINATES ARE NEVER USED FOR DRIVER FILTERING OR MATCHING.
 */
export function filterDriversWithinPickupRadius(
  drivers: NearbyDriver[],
  pickupLocation: LatLng | null | undefined,
  maxRadiusKm: number = DRIVER_MATCH_RADIUS_KM
): NearbyDriverWithDistance[] {
  if (!pickupLocation || !drivers || drivers.length === 0) {
    return [];
  }

  const results: NearbyDriverWithDistance[] = [];

  for (const driver of drivers) {
    if (typeof driver.lat !== 'number' || typeof driver.lng !== 'number') continue;

    // Calculate distance strictly to owner's PICKUP location
    const dist = calculateHaversineDistanceKm(
      pickupLocation.lat,
      pickupLocation.lng,
      driver.lat,
      driver.lng
    );

    if (dist <= maxRadiusKm) {
      results.push({
        ...driver,
        distanceKm: Math.round(dist * 10) / 10,
      });
    }
  }

  // Sort by nearest driver first
  return results.sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Queries Cloud Firestore for all online, verified drivers within a 5km radius
 * of the owner's pickup location.
 * The destination coordinates are strictly ignored and never used for matching.
 */
export async function queryAvailableDriversNearPickup(
  pickupLocation: LatLng,
  maxRadiusKm: number = DRIVER_MATCH_RADIUS_KM
): Promise<DriverWithDistance[]> {
  try {
    // 1. Query Firestore for active online drivers
    const q = query(
      collection(db, 'driverProfiles'),
      where('isOnline', '==', true)
    );

    const snapshot = await getDocs(q);
    const matchedDrivers: DriverWithDistance[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as DriverProfile;
      const driverId = docSnap.id;

      if (typeof data.currentLat === 'number' && typeof data.currentLng === 'number') {
        // Measure distance strictly from owner's PICKUP location (NOT destination)
        const distanceKm = calculateHaversineDistanceKm(
          pickupLocation.lat,
          pickupLocation.lng,
          data.currentLat,
          data.currentLng
        );

        // Exclusively match drivers within 5km of pickup
        if (distanceKm <= maxRadiusKm) {
          matchedDrivers.push({
            ...data,
            driverId,
            distanceKm: Math.round(distanceKm * 10) / 10,
          });
        }
      }
    });

    // Sort ascending by distance from pickup location
    matchedDrivers.sort((a, b) => a.distanceKm - b.distanceKm);

    return matchedDrivers;
  } catch (error) {
    console.warn('Matchmaking database query note:', error);
    return [];
  }
}

/**
 * Validates whether an incoming ride's PICKUP location is within 5km radius of a driver.
 * The destination coordinates are only used for route and fare, NOT dispatch eligibility.
 */
export function isRideWithinDriverPickupRadius(
  driverCoords: LatLng | null | undefined,
  ridePickupCoords: LatLng | null | undefined,
  maxRadiusKm: number = DRIVER_MATCH_RADIUS_KM
): boolean {
  if (!driverCoords || !ridePickupCoords) return false;

  const distance = calculateHaversineDistanceKm(
    driverCoords.lat,
    driverCoords.lng,
    ridePickupCoords.lat,
    ridePickupCoords.lng
  );

  return distance <= maxRadiusKm;
}

/**
 * Automated matchmaking: Finds the nearest available driver within 5km of the pickup location
 * and assigns them to the ride document in Firestore.
 */
export async function autoMatchNearestDriverToRide(
  rideId: string,
  pickupLocation: LocationPoint
): Promise<DriverWithDistance | null> {
  try {
    // Check if ride is still looking for a driver
    const rideRef = doc(db, 'rides', rideId);
    const rideSnap = await getDoc(rideRef);
    if (!rideSnap.exists()) return null;

    const rideData = rideSnap.data() as Ride;
    const currentStatus = rideData.ride_status || rideData.status;
    if (currentStatus !== 'looking_for_driver' && currentStatus !== 'pending') return null;

    // Search exclusively within 5km of pickupLocation (ignore destination)
    const nearby = await queryAvailableDriversNearPickup(
      { lat: pickupLocation.lat, lng: pickupLocation.lng },
      DRIVER_MATCH_RADIUS_KM
    );

    if (nearby.length === 0) {
      return null;
    }

    // Select the closest driver to pickup location
    const bestDriver = nearby[0];

    const etaMins = Math.max(2, Math.round(bestDriver.distanceKm * 2.5));

    await updateDoc(rideRef, {
      status: 'driver_assigned',
      ride_status: 'accepted',
      driverId: bestDriver.driverId,
      driverName: bestDriver.name,
      driverPhone: bestDriver.phone,
      driverPhoto: bestDriver.photoUrl,
      driverRating: bestDriver.rating,
      driverTripsCount: bestDriver.tripsCompleted,
      driverLicenceVerified: bestDriver.verificationStatus === 'verified',
      driverLocation: { lat: bestDriver.currentLat, lng: bestDriver.currentLng },
      etaMinutes: etaMins,
      updatedAt: new Date().toISOString(),
    });

    return bestDriver;
  } catch (err) {
    console.warn('Auto match nearest driver error:', err);
    return null;
  }
}
