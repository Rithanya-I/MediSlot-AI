-- ============================================================================
-- MediSlot-AI : Supabase PostgreSQL Database Schema
-- Run this in your Supabase Project: SQL Editor -> New Query -> Run
-- ============================================================================

-- 1. Users table (synced with authentication)
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Patient',
  role TEXT NOT NULL DEFAULT 'patient',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Specialists directory
CREATE TABLE IF NOT EXISTS public.specialists (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  credentials TEXT NOT NULL,
  specialty TEXT NOT NULL,
  department TEXT NOT NULL,
  clinic_location TEXT NOT NULL,
  bio TEXT NOT NULL,
  education TEXT NOT NULL,
  languages TEXT NOT NULL,
  years_experience INTEGER NOT NULL,
  consultation_minutes INTEGER NOT NULL DEFAULT 30,
  rating TEXT NOT NULL,
  accepts_telehealth BOOLEAN NOT NULL DEFAULT TRUE,
  avatar_url TEXT,
  insurances_accepted TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Clinic slots
CREATE TABLE IF NOT EXISTS public.clinic_slots (
  id SERIAL PRIMARY KEY,
  specialist_id INTEGER NOT NULL REFERENCES public.specialists(id) ON DELETE CASCADE,
  slot_date TEXT NOT NULL,
  slot_time TEXT NOT NULL,
  is_ai_recommended BOOLEAN NOT NULL DEFAULT FALSE,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  visit_mode TEXT NOT NULL DEFAULT 'both'
);

-- 4. Appointments
CREATE TABLE IF NOT EXISTS public.appointments (
  id SERIAL PRIMARY KEY,
  reference_code TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  specialist_id INTEGER NOT NULL REFERENCES public.specialists(id) ON DELETE RESTRICT,
  slot_date TEXT NOT NULL,
  slot_time TEXT NOT NULL,
  visit_type TEXT NOT NULL DEFAULT 'In-Person',
  status TEXT NOT NULL DEFAULT 'Confirmed',
  reason TEXT NOT NULL,
  triage_urgency TEXT NOT NULL DEFAULT 'Routine',
  prep_notes TEXT,
  vitals_precheck TEXT,
  check_in_status TEXT NOT NULL DEFAULT 'Scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. Patient health profiles
CREATE TABLE IF NOT EXISTS public.patient_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  date_of_birth TEXT NOT NULL DEFAULT '1990-05-14',
  phone TEXT NOT NULL DEFAULT '+1 (415) 555-0192',
  blood_type TEXT NOT NULL DEFAULT 'O+',
  allergies TEXT NOT NULL DEFAULT 'None reported',
  medications TEXT NOT NULL DEFAULT 'None reported',
  conditions TEXT NOT NULL DEFAULT 'None reported',
  emergency_contact_name TEXT NOT NULL DEFAULT '',
  emergency_contact_phone TEXT NOT NULL DEFAULT '',
  insurance_carrier TEXT NOT NULL DEFAULT 'BlueCross BlueShield',
  insurance_plan TEXT NOT NULL DEFAULT 'PPO Gold Select',
  member_id TEXT NOT NULL DEFAULT 'BCBS-8841209',
  group_number TEXT NOT NULL DEFAULT 'GRP-44021',
  copay_amount TEXT NOT NULL DEFAULT '$25',
  coverage_status TEXT NOT NULL DEFAULT 'Verified',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 6. AI Triage assessments
CREATE TABLE IF NOT EXISTS public.triage_assessments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  symptoms TEXT NOT NULL,
  duration TEXT NOT NULL,
  severity TEXT NOT NULL,
  recommended_specialty TEXT NOT NULL,
  urgency_level TEXT NOT NULL,
  ai_summary TEXT NOT NULL,
  prep_checklist TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 7. Care desk messages
CREATE TABLE IF NOT EXISTS public.care_messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  specialist_id INTEGER REFERENCES public.specialists(id) ON DELETE SET NULL,
  sender_role TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- INDEXES for Query Optimization
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_uid ON public.users(uid);
CREATE INDEX IF NOT EXISTS idx_clinic_slots_specialist_date ON public.clinic_slots(specialist_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_specialist_slot ON public.appointments(specialist_id, slot_date, slot_time);
CREATE INDEX IF NOT EXISTS idx_care_messages_user_id ON public.care_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_triage_user_id ON public.triage_assessments(user_id);
