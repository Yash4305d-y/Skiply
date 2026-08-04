-- ==============================================================================
-- 7. Add Reminders Preference to Profiles
-- ==============================================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reminders_enabled BOOLEAN DEFAULT TRUE;
