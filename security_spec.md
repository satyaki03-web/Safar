# Security Specification: Safar Peer-to-Peer Driver Marketplace

## 1. Data Invariants
1. A user profile document `/users/{userId}` can only be read or written by the authenticated owner (`request.auth.uid == userId`).
2. A vehicle `/vehicles/{vehicleId}` can only be created, updated, or deleted by its owner (`ownerId == request.auth.uid`).
3. A driver profile `/driverProfiles/{driverId}` must match `request.auth.uid == driverId`. Drivers can only update their own status, availability, and location.
4. A ride `/rides/{rideId}` can be created by the owner with `status: 'looking_for_driver'`.
5. Drivers can only accept a ride that is currently `looking_for_driver` by transitioning it to `driver_assigned` with atomic assignment of `driverId`.
6. Once assigned, only the assigned driver or the owner can update the ride according to valid state transitions (`looking_for_driver` -> `driver_assigned` -> `driver_en_route` -> `driver_arrived` -> `ride_active` -> `completed`).
7. Ratings can only be created by participants of the ride (either `ownerId` or `driverId`), with score bounded between 1 and 5.

## 2. The Dirty Dozen Payloads (Targeting Vulnerabilities)
1. **Unauthenticated User Profile Creation**: Anonymous or null auth creating `/users/victim_123` -> Rejected.
2. **Owner Impersonation on Vehicle**: User B registering a vehicle with `ownerId: "user_A"` -> Rejected.
3. **Cross-Tenant Vehicle Deletion**: User B deleting `/vehicles/v_123` owned by User A -> Rejected.
4. **Driver Profile Verification Tampering**: Driver setting `verificationStatus: "verified"` without proper admin gating -> Rejected.
5. **Ride Hijack by Secondary Driver**: Driver C attempting to overwrite `driverId` on an already assigned ride -> Rejected.
6. **State Machine Leapfrog**: Owner or driver advancing status directly from `looking_for_driver` to `completed` -> Rejected.
7. **Fake Completion OTP Bypass**: Driver attempting to advance to `ride_active` without matching verified trigger -> Rejected.
8. **Malicious Fare Overwrite on Active Ride**: Driver altering `fareEstimate.totalFare` during an active trip -> Rejected.
9. **Unrelated Third-Party Read on Ride**: User C trying to query private ride details and OTP of User A and Driver B -> Rejected.
10. **Bogus 100-Star Rating**: Submitting `score: 100` on `/ratings/r_123` -> Rejected.
11. **Review Tampering After Completion**: Mutating someone else's rating notes -> Rejected.
12. **Denial-of-Wallet Payload**: Injecting a 2MB string into address field -> Rejected.
