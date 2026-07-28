-- ============================================================================
-- SQL SCRIPT: DATABASE TIMESTAMPS & AUTOMATIC UPDATES
-- Run this in your Supabase SQL Editor.
-- ============================================================================

-- 1. Create a reusable trigger function to automatically update 'updated_at' to NOW()
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Enforce TIMESTAMPTZ formatting for 'created_at' and 'updated_at' on key tables

-- Profiles
ALTER TABLE public.profiles
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::TIMESTAMPTZ,
    ALTER COLUMN created_at SET DEFAULT NOW(),
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at::TIMESTAMPTZ,
    ALTER COLUMN updated_at SET DEFAULT NOW();

-- Subjects
ALTER TABLE public.subjects
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::TIMESTAMPTZ,
    ALTER COLUMN created_at SET DEFAULT NOW(),
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at::TIMESTAMPTZ,
    ALTER COLUMN updated_at SET DEFAULT NOW();

-- Timetable Slots
ALTER TABLE public.timetable_slots
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::TIMESTAMPTZ,
    ALTER COLUMN created_at SET DEFAULT NOW(),
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at::TIMESTAMPTZ,
    ALTER COLUMN updated_at SET DEFAULT NOW();

-- Holidays
ALTER TABLE public.holidays
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::TIMESTAMPTZ,
    ALTER COLUMN created_at SET DEFAULT NOW(),
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at::TIMESTAMPTZ,
    ALTER COLUMN updated_at SET DEFAULT NOW();

-- Attendance Logs
ALTER TABLE public.attendance_logs
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::TIMESTAMPTZ,
    ALTER COLUMN created_at SET DEFAULT NOW(),
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at::TIMESTAMPTZ,
    ALTER COLUMN updated_at SET DEFAULT NOW();

-- 3. Attach the trigger to tables so it automatically fires on any UPDATE

-- Profiles trigger
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

-- Subjects trigger
DROP TRIGGER IF EXISTS trg_subjects_updated_at ON public.subjects;
CREATE TRIGGER trg_subjects_updated_at
BEFORE UPDATE ON public.subjects
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

-- Timetable Slots trigger
DROP TRIGGER IF EXISTS trg_timetable_slots_updated_at ON public.timetable_slots;
CREATE TRIGGER trg_timetable_slots_updated_at
BEFORE UPDATE ON public.timetable_slots
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

-- Holidays trigger
DROP TRIGGER IF EXISTS trg_holidays_updated_at ON public.holidays;
CREATE TRIGGER trg_holidays_updated_at
BEFORE UPDATE ON public.holidays
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

-- Attendance Logs trigger
DROP TRIGGER IF EXISTS trg_attendance_logs_updated_at ON public.attendance_logs;
CREATE TRIGGER trg_attendance_logs_updated_at
BEFORE UPDATE ON public.attendance_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

-- ============================================================================
-- End of Script
-- ============================================================================
