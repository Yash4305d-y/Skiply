-- ==============================================================================
-- SKIPLY (ATTENDRA) — SUPABASE POSTGRESQL SCHEMA & RLS POLICIES
-- ==============================================================================
-- Execute this file in your Supabase SQL Editor (https://app.supabase.com)
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. Reset Schema (Added to fix manual edits)
DROP TABLE IF EXISTS attendance_logs CASCADE;
DROP TABLE IF EXISTS holidays CASCADE;
DROP TABLE IF EXISTS academic_holidays CASCADE;
DROP TABLE IF EXISTS timetable_slots CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 1. Profiles Table (Extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    password TEXT,
    email TEXT,
    target_attendance_percentage NUMERIC(5,2) DEFAULT 75.00 CHECK (target_attendance_percentage >= 0 AND target_attendance_percentage <= 100),
    semester_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    semester_end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '4 months'),
    schedule_type TEXT DEFAULT 'STANDARD_WEEK' CHECK (schedule_type IN ('STANDARD_WEEK', 'DAY_CYCLE')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    subject_code TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    is_lab BOOLEAN DEFAULT FALSE,
    credit_hours INTEGER DEFAULT 3,
    color_hex TEXT DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Timetable Slots Table (The Weekly Schedule Master)
CREATE TABLE IF NOT EXISTS timetable_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Academic Calendar & Holidays Table
-- Backward compatibility if academic_holidays was created previously:
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'academic_holidays') THEN
        ALTER TABLE IF EXISTS academic_holidays RENAME TO holidays;
    END IF;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'holidays' AND column_name = 'description') THEN
        ALTER TABLE IF EXISTS holidays RENAME COLUMN description TO holiday_name;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    holiday_date DATE NOT NULL,
    holiday_name TEXT NOT NULL,
    is_exam_day BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, holiday_date)
);

-- 5. Daily Attendance Logs Table
CREATE TABLE IF NOT EXISTS attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
    timetable_slot_id UUID REFERENCES timetable_slots(id) ON DELETE SET NULL,
    log_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'CANCELLED', 'SWAPPED')),
    notes TEXT,
    swapped_subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL, -- Used when status is SWAPPED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, subject_id, timetable_slot_id, log_date)
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE & MATH ANALYTICS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_subjects_user ON subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_slots_user_day ON timetable_slots(user_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_holidays_user_date ON holidays(user_id, holiday_date);
CREATE INDEX IF NOT EXISTS idx_attendance_user_subject_date ON attendance_logs(user_id, subject_id, log_date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_logs(user_id, log_date);

-- ==============================================================================
-- AUTOMATIC TIMESTAMP UPDATING FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_subjects_updated_at ON subjects;
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_timetable_slots_updated_at ON timetable_slots;
CREATE TRIGGER update_timetable_slots_updated_at BEFORE UPDATE ON timetable_slots FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_holidays_updated_at ON holidays;
CREATE TRIGGER update_holidays_updated_at BEFORE UPDATE ON holidays FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_attendance_logs_updated_at ON attendance_logs;
CREATE TRIGGER update_attendance_logs_updated_at BEFORE UPDATE ON attendance_logs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Subjects Policies
DROP POLICY IF EXISTS "Users can view own subjects" ON subjects;
CREATE POLICY "Users can view own subjects" ON subjects FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own subjects" ON subjects;
CREATE POLICY "Users can insert own subjects" ON subjects FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own subjects" ON subjects;
CREATE POLICY "Users can update own subjects" ON subjects FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own subjects" ON subjects;
CREATE POLICY "Users can delete own subjects" ON subjects FOR DELETE USING (auth.uid() = user_id);

-- Timetable Slots Policies
DROP POLICY IF EXISTS "Users can view own timetable slots" ON timetable_slots;
CREATE POLICY "Users can view own timetable slots" ON timetable_slots FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own timetable slots" ON timetable_slots;
CREATE POLICY "Users can insert own timetable slots" ON timetable_slots FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own timetable slots" ON timetable_slots;
CREATE POLICY "Users can update own timetable slots" ON timetable_slots FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own timetable slots" ON timetable_slots;
CREATE POLICY "Users can delete own timetable slots" ON timetable_slots FOR DELETE USING (auth.uid() = user_id);

-- Academic Holidays Policies
DROP POLICY IF EXISTS "Users can view own holidays" ON holidays;
CREATE POLICY "Users can view own holidays" ON holidays FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own holidays" ON holidays;
CREATE POLICY "Users can insert own holidays" ON holidays FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own holidays" ON holidays;
CREATE POLICY "Users can update own holidays" ON holidays FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own holidays" ON holidays;
CREATE POLICY "Users can delete own holidays" ON holidays FOR DELETE USING (auth.uid() = user_id);

-- Attendance Logs Policies
DROP POLICY IF EXISTS "Users can view own attendance logs" ON attendance_logs;
CREATE POLICY "Users can view own attendance logs" ON attendance_logs FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own attendance logs" ON attendance_logs;
CREATE POLICY "Users can insert own attendance logs" ON attendance_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own attendance logs" ON attendance_logs;
CREATE POLICY "Users can update own attendance logs" ON attendance_logs FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own attendance logs" ON attendance_logs;
CREATE POLICY "Users can delete own attendance logs" ON attendance_logs FOR DELETE USING (auth.uid() = user_id);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON USER SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, email, password, semester_start_date, semester_end_date)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'Student'),
    NEW.email,
    NEW.raw_user_meta_data->>'password',
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'semester_start_date', '')::date, CURRENT_DATE),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'semester_end_date', '')::date, CURRENT_DATE + INTERVAL '4 months')
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    password = EXCLUDED.password,
    semester_start_date = COALESCE(EXCLUDED.semester_start_date, profiles.semester_start_date),
    semester_end_date = COALESCE(EXCLUDED.semester_end_date, profiles.semester_end_date);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Fallback if parsing dates fails or other errors occur, just insert the minimum required fields
  INSERT INTO public.profiles (id, username, full_name, email, password)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'Student'),
    NEW.email,
    NEW.raw_user_meta_data->>'password'
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    password = EXCLUDED.password;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- STORAGE BUCKET CONFIGURATION (For Timetable Images & Academic Calendars)
-- ==============================================================================
-- Note: Create a private bucket named 'schedule-uploads' in Supabase Storage UI.
-- Policy for schedule-uploads bucket:
-- CREATE POLICY "User can access own uploads" ON storage.objects FOR ALL USING (bucket_id = 'schedule-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ==============================================================================
-- 6. FCM Tokens Table (For Push Notifications)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS fcm_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    token TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user ON fcm_tokens(user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_fcm_tokens_updated_at ON fcm_tokens;
CREATE TRIGGER update_fcm_tokens_updated_at 
BEFORE UPDATE ON fcm_tokens 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RLS Policies
ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own fcm tokens" ON fcm_tokens;
CREATE POLICY "Users can view own fcm tokens" ON fcm_tokens FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own fcm tokens" ON fcm_tokens;
CREATE POLICY "Users can insert own fcm tokens" ON fcm_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own fcm tokens" ON fcm_tokens;
CREATE POLICY "Users can delete own fcm tokens" ON fcm_tokens FOR DELETE USING (auth.uid() = user_id);

-- ==============================================================================
-- 7. Add Reminders Preference to Profiles
-- ==============================================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reminders_enabled BOOLEAN DEFAULT TRUE;
