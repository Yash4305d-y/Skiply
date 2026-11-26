# Skiply Database Schema & Deterministic Math Engine

This document covers the Supabase PostgreSQL schema, Row-Level Security (RLS) policies, SQL migrations, TypeScript data contracts, and the deterministic Safe-Skip calculation engine.

---

## 1. Supabase PostgreSQL Schema

Base schema: [`supabase-schema.sql`](../supabase-schema.sql)  
Incremental migrations: [`sql/`](../sql/)

### Tables Overview

| Table | Primary Key | Foreign Keys | Purpose |
| :--- | :--- | :--- | :--- |
| `profiles` | `id (UUID)` | `auth.users(id) ON DELETE CASCADE` | Student profile, `username`, `full_name`, `target_attendance_percentage` (default `75.00`), `semester_start_date`, `semester_end_date`, `schedule_type` (`STANDARD_WEEK` \| `DAY_CYCLE`), `reminders_enabled` (added via `sql/03_add_reminders_preference.sql`). |
| `subjects` | `id (UUID)` | `user_id -> profiles(id)` | Enrolled courses & labs (`subject_code`, `subject_name`, `is_lab`, `credit_hours`, `color_hex`). |
| `timetable_slots` | `id (UUID)` | `user_id -> profiles(id)`, `subject_id -> subjects(id)` | Weekly recurring class slots (`day_of_week` `0–6`, `start_time`, `end_time`, `room_number`). |
| `holidays` | `id (UUID)` | `user_id -> profiles(id)` | Academic holidays / exam days (`holiday_date`, `holiday_name`, `is_exam_day`). Unique `(user_id, holiday_date)`. *(Backward-compatible with legacy `academic_holidays` / `description` in `db.ts`.)* |
| `attendance_logs` | `id (UUID)` | `user_id -> profiles(id)`, `subject_id -> subjects(id)`, `timetable_slot_id -> timetable_slots(id) ON DELETE SET NULL`, `swapped_subject_id -> subjects(id) ON DELETE SET NULL` | Daily attendance records (`log_date`, `status`: `PRESENT` \| `ABSENT` \| `CANCELLED` \| `SWAPPED`, `notes`). Unique `(user_id, subject_id, timetable_slot_id, log_date)`. |
| `fcm_tokens` | `id (UUID)` | `user_id -> profiles(id)` | Device push tokens for Firebase Cloud Messaging (`token`). Unique `(user_id, token)`. Added via [`sql/02_fcm_tokens.sql`](../sql/02_fcm_tokens.sql). |

### Indexes
- `idx_subjects_user` on `subjects(user_id)`
- `idx_slots_user_day` on `timetable_slots(user_id, day_of_week)`
- `idx_holidays_user_date` on `holidays(user_id, holiday_date)`
- `idx_attendance_user_subject_date` on `attendance_logs(user_id, subject_id, log_date)`
- `idx_attendance_date` on `attendance_logs(user_id, log_date)`
- `idx_fcm_tokens_user` on `fcm_tokens(user_id)`

### Row-Level Security (RLS) & Triggers
- **RLS Enabled** on all 6 tables (`profiles`, `subjects`, `timetable_slots`, `holidays`, `attendance_logs`, `fcm_tokens`).
- All user policies enforce `auth.uid() = id` (for `profiles`) or `auth.uid() = user_id` (for child tables) across `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
- **Auto-profile creation**: `public.handle_new_user()` trigger on `auth.users` inserts a matching row into `public.profiles` on signup.
- **Timestamps**: `update_updated_at_column()` / `public.update_modified_column()` ([`sql/setup_triggers.sql`](../sql/setup_triggers.sql)) keeps `updated_at` synced on `UPDATE`.

### Migration Execution Order (New Supabase Project)
1. Run [`supabase-schema.sql`](../supabase-schema.sql) in the Supabase SQL Editor.
2. Run [`sql/02_fcm_tokens.sql`](../sql/02_fcm_tokens.sql) for push notification token storage.
3. Run [`sql/03_add_reminders_preference.sql`](../sql/03_add_reminders_preference.sql) for `profiles.reminders_enabled`.
4. Optionally run [`sql/setup_triggers.sql`](../sql/setup_triggers.sql) to normalize `TIMESTAMPTZ` columns and `trg_*_updated_at` triggers.

---

## 2. Core TypeScript Contracts ([`src/types/index.ts`](../src/types/index.ts))

- `AttendanceStatus`: `'PRESENT' | 'ABSENT' | 'CANCELLED' | 'SWAPPED'`
- `SafeSkipStatus`: `'SAFE' | 'WARNING' | 'DANGER'`
- `ScheduleType`: `'STANDARD_WEEK' | 'DAY_CYCLE'`
- Primary entity interfaces: `Profile`, `Subject`, `TimetableSlot`, `AcademicHoliday`, `AttendanceLog`
- Computed view-model interfaces: `SubjectAttendanceStats`, `OverallSemesterStats`, `DailyClassItem`
- Onboarding AI extraction interfaces: `AIExtractedSubject`, `AIExtractedSlot`, `AIExtractedHoliday`, `AIParsingResult`

---

## 3. Deterministic Math Engine ([`src/lib/math-engine.ts`](../src/lib/math-engine.ts))

**Rule:** 100% deterministic TypeScript arithmetic. Never delegate attendance math to an LLM.

### Key Functions

1. **`calculateConductedTillDate(subjectId, slots, holidays, startDateStr, toTimeMs, extraClasses, cancelledClasses)`**
   - Iterates day-by-day from `semester_start_date` through `toTimeMs`.
   - Excludes dates present in `holidays`.
   - Counts matching `timetable_slots` per `day_of_week`, adds `extraClasses`, and subtracts `cancelledClasses` (clamped to `>= 0`).

2. **`calculateRemainingLectures(subjectId, slots, holidays, endDateStr, fromTimeMs)`**
   - Iterates day-by-day starting from **tomorrow** (`fromTimeMs + 1 day`) through `semester_end_date`.
   - Excludes dates present in `holidays` and counts scheduled `timetable_slots` per `day_of_week`.

3. **`calculateSubjectStats(subject, present, absent, cancelled, swapped, remaining, defaultTargetPct, conductedOverride)`**
   - `conducted`: `conductedOverride` (from `calculateConductedTillDate`) if provided, else `present + absent`.
   - `effectiveAbsent`: `max(0, conducted - present)` when `conductedOverride` is used, else `absent`.
   - `totalAvailable`: `conducted + remaining` (or `conducted` if total is 0).
   - `targetDec`: `(subject.target_attendance_percentage || defaultTargetPct) / 100`.
   - **Current Percentage**: `conducted === 0 ? 100.0 : (present / conducted) * 100`.
   - **Safe Skips**:
     $$\text{safeSkips} = \lfloor \text{totalAvailable} \times (1 - \text{targetDec}) \rfloor - \text{effectiveAbsent}$$
   - **Recovery Classes Needed** (when `safeSkips < 0`):
     $$\text{requiredTotalPresents} = \lceil \text{targetDec} \times \text{totalAvailable} \rceil$$
     $$\text{classesToAttend} = \max(1, \text{requiredTotalPresents} - \text{present})$$
     If `classesToAttend > remaining`, flags that the target cannot be achieved with the remaining lectures.
   - **Status Classification**:
     - `SAFE`: `safeSkips > 2`
     - `WARNING`: `0 <= safeSkips <= 2`
     - `DANGER`: `safeSkips < 0`

4. **`calculateOverallSemesterStats(subjects, slots, holidays, logs, targetPct, endDateStr, startDateStr)`**
   - Aggregates per-subject stats for the Dashboard `HeroWidget`.
   - Overall `status` becomes `DANGER` if `subjectsInDanger > 0`, `WARNING` if `totalSafeSkips === 0`, otherwise `SAFE`.

### Unit Tests
Tests live in [`src/lib/__tests__/math-engine.test.ts`](../src/lib/__tests__/math-engine.test.ts).
