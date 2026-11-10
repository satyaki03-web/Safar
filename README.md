# Safar (সফর) — Peer-to-Peer Driver-as-a-Service

Safar is an installable Progressive Web App (React + TypeScript + Tailwind CSS) built for Kolkata, India. Car owners hire verified local chauffeurs by the hour or trip to drive the owner's own car.

## Core Architecture

### Role-Based Experiences
- **Owner Flow**: Phone authentication, register vehicles with transmission and fuel type, select pickup on Kolkata map with draggable pin, transparent line-by-line fare estimation (₹180/hr + night surcharge + outstation allowance + platform fee), real-time driver dispatch, arrival 4-digit OTP verification, live map GPS tracking with SOS emergency button, itemized ledger receipt with simulated Razorpay UPI payment and mutual 5-star rating.
- **Driver Flow**: Commercial driving licence onboarding with RTO verification status, online/offline dispatch toggle, 30-second accept window for Kolkata area requests, turn-by-turn pickup navigation via Google Maps, owner OTP verification to start, real-time GPS coordinate telemetry to Firestore every 4s, and weekly earnings ledger.

### Ride State Machine
```
looking_for_driver ──► driver_assigned ──► driver_en_route ──► driver_arrived ──► ride_active ──► completed
       │                     │
       ▼                     ▼
cancelled_by_owner    cancelled_by_driver
```

### Design System
- **Ink**: `#15130F` (text, primary buttons)
- **Paper**: `#F5F0E6` (warm transit ticket background)
- **Taxi Yellow**: `#F2B705` (accent, map routes, active states)
- **River Green**: `#0F3D36` (driver controls, secondary badges)
- **Signal Red**: `#C8321E` (SOS emergency triggers)
- **Rule**: `#D9D1BF` (ledger hairline dividers)
- **Typography**: Fraunces (display/headings), Schibsted Grotesk (UI body), JetBrains Mono (fares, tokens, timers)
- **Metaphor**: Ledger and Kolkata printed transit ticket with perforated SVG edges and 6px border radius.
- **Custom Icons**: Handcrafted 24px SVG icon set with 1.75px stroke and square caps (zero third-party icon packages).

## Cloud Firestore Collections & Security Rules
- `/users/{userId}`: User profile and role access.
- `/vehicles/{vehicleId}`: Owner registered vehicles (make, model, year, registration, transmission, fuel).
- `/driverProfiles/{driverId}`: Commercial licence details, qualification tags, verification status, and earnings.
- `/rides/{rideId}`: Central trip state machine with atomic driver acceptance transaction and state transition checks.
- `/ratings/{ratingId}`: Post-trip mutual ratings (1 to 5 stars) and feedback notes.

Rules are defined in `firestore.rules` and deployed via Firebase RPC.

## Demo Mode Walkthrough (Single-Device Evaluation)
To evaluate the full peer-to-peer flow on one device without requiring two phones:
1. Open **Settings & Profile** from the top right avatar.
2. Ensure **Demo Mode Simulation** is toggled **ON** (active by default).
3. On Owner Home, pick any Kolkata locality (e.g. *Sector V, Salt Lake* or drag the pin) and click **Review Fare & Find Driver**.
4. Confirm the booking. Within 3.5 seconds, the demo engine automatically pairs verified driver **Subhashish Das** (`WB-01-2016-0048192`).
5. Observe the ETA countdown and the 4-digit OTP (e.g. `4829`).
6. Advance through Driver En Route and Arrived states.
7. During the live ride, watch the car smoothly traverse Kolkata landmarks from Park Circus along Maa Flyover to Salt Lake Sector V on the map.
8. End the trip to view the itemized ledger receipt with the stubbed **Trip cover** insurance line item, test simulated UPI payment, and submit a 5-star rating.
