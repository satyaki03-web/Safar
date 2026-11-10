-- ==============================================================================
-- Safar Application - Supabase PostgreSQL Schema & Migrations
-- Peer-to-peer Driver-as-a-Service marketplace for Kolkata
-- ==============================================================================

-- 1. Profiles Table (Car Owners & Drivers)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY, -- maps to UserProfile uid
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'driver', 'both')),
  current_role TEXT NOT NULL CHECK (current_role IN ('owner', 'driver')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Vehicles Table (Registered vehicles owned by car owners)
CREATE TABLE IF NOT EXISTS public.vehicles (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  registration_number TEXT NOT NULL,
  transmission TEXT NOT NULL CHECK (transmission IN ('manual', 'automatic')),
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('petrol', 'diesel', 'cng', 'ev')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vehicles_owner ON public.vehicles(owner_id);

-- 3. Driver Profiles Table (Commercial driving qualifications & ratings)
CREATE TABLE IF NOT EXISTS public.driver_profiles (
  driver_id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  photo_url TEXT,
  licence_number TEXT NOT NULL,
  licence_expiry TEXT NOT NULL,
  experience_years INTEGER NOT NULL DEFAULT 5,
  vehicle_types JSONB NOT NULL DEFAULT '["manual", "automatic"]'::jsonb,
  service_areas JSONB NOT NULL DEFAULT '["Kolkata", "Salt Lake", "New Town"]'::jsonb,
  verification_status TEXT NOT NULL DEFAULT 'verified' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  is_online BOOLEAN NOT NULL DEFAULT true,
  current_lat DOUBLE PRECISION NOT NULL DEFAULT 22.5726,
  current_lng DOUBLE PRECISION NOT NULL DEFAULT 88.3639,
  rating DOUBLE PRECISION NOT NULL DEFAULT 4.9,
  trips_completed INTEGER NOT NULL DEFAULT 0,
  total_earnings NUMERIC(10, 2) NOT NULL DEFAULT 0,
  today_earnings NUMERIC(10, 2) NOT NULL DEFAULT 0,
  week_earnings NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Rides Table (On-demand and scheduled driver bookings)
CREATE TABLE IF NOT EXISTS public.rides (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  driver_id TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  driver_photo TEXT,
  driver_rating DOUBLE PRECISION,
  driver_trips_count INTEGER,
  driver_licence_verified BOOLEAN,
  vehicle_id TEXT NOT NULL,
  vehicle_info JSONB NOT NULL,
  pickup_location JSONB NOT NULL,
  destination_location JSONB,
  trip_type TEXT NOT NULL CHECK (trip_type IN ('commute', 'evening_out', 'outstation', 'airport', 'subscription')),
  start_time TEXT NOT NULL,
  duration_hours INTEGER NOT NULL DEFAULT 4,
  outstation_days INTEGER,
  fare_estimate JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN (
    'looking_for_driver',
    'driver_assigned',
    'driver_en_route',
    'driver_arrived',
    'ride_active',
    'completed',
    'cancelled_by_owner',
    'cancelled_by_driver',
    'expired'
  )),
  otp TEXT NOT NULL,
  driver_location JSONB,
  eta_minutes INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  payment_method TEXT,
  payment_reference TEXT,
  driver_brief JSONB,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_owner ON public.rides(owner_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver ON public.rides(driver_id);

-- 5. Subscriptions Table (Weekly, monthly, or recurring customized days bookings)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  driver_id TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  driver_phone TEXT NOT NULL,
  driver_photo TEXT,
  driver_rating DOUBLE PRECISION NOT NULL,
  driver_experience_years INTEGER NOT NULL,
  vehicle_id TEXT NOT NULL,
  vehicle_info JSONB NOT NULL,
  pickup_location JSONB NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('week', 'month', 'custom_days')),
  selected_days JSONB NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  total_days INTEGER NOT NULL,
  working_days_count INTEGER NOT NULL,
  daily_duty_hours INTEGER NOT NULL,
  daily_start_time TEXT NOT NULL,
  per_day_rate NUMERIC(10, 2) NOT NULL,
  discount_percent INTEGER NOT NULL DEFAULT 0,
  subtotal NUMERIC(10, 2) NOT NULL,
  savings NUMERIC(10, 2) NOT NULL,
  total_fare NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'scheduled', 'completed', 'cancelled')),
  notes TEXT,
  driver_brief JSONB,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_owner ON public.subscriptions(owner_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- 6. Ratings Table
CREATE TABLE IF NOT EXISTS public.ratings (
  id TEXT PRIMARY KEY,
  ride_id TEXT NOT NULL,
  rater_id TEXT NOT NULL,
  rater_role TEXT NOT NULL CHECK (rater_role IN ('owner', 'driver')),
  target_user_id TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 7. Row Level Security (RLS) Configuration
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Permissive public policies for client application with anon key
DROP POLICY IF EXISTS "Public can view and update profiles" ON public.profiles;
CREATE POLICY "Public can view and update profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view and manage vehicles" ON public.vehicles;
CREATE POLICY "Public can view and manage vehicles" ON public.vehicles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view and manage driver profiles" ON public.driver_profiles;
CREATE POLICY "Public can view and manage driver profiles" ON public.driver_profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view and manage rides" ON public.rides;
CREATE POLICY "Public can view and manage rides" ON public.rides FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view and manage subscriptions" ON public.subscriptions;
CREATE POLICY "Public can view and manage subscriptions" ON public.subscriptions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view and manage ratings" ON public.ratings;
CREATE POLICY "Public can view and manage ratings" ON public.ratings FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 8. Enable Realtime Publications for Live Dispatch & Map Tracking
-- ==============================================================================
-- Allows Supabase to broadcast INSERT/UPDATE/DELETE events to web and mobile clients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'rides'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'subscriptions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
  END IF;
END $$;
