// ==============================================================================
// SKIPLY (ATTENDRA) — CORE TYPESCRIPT DEFINITIONS
// ==============================================================================

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'CANCELLED' | 'SWAPPED';

export type ScheduleType = 'STANDARD_WEEK' | 'DAY_CYCLE';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  target_attendance_percentage: number;
  semester_start_date: string; // ISO date string YYYY-MM-DD
  semester_end_date: string;   // ISO date string YYYY-MM-DD
  schedule_type: ScheduleType;
  created_at?: string;
  updated_at?: string;
}

export interface Subject {
  id: string;
  user_id: string;
  subject_code: string;
  subject_name: string;
  is_lab: boolean;
  credit_hours: number;
  color_hex?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TimetableSlot {
  id: string;
  user_id: string;
  subject_id: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  start_time: string;  // "HH:MM" or "HH:MM:SS"
  end_time: string;    // "HH:MM" or "HH:MM:SS"
  room_number?: string | null;
  created_at?: string;
  updated_at?: string;
  subject?: Subject;   // Joined relation
}

export interface AcademicHoliday {
  id: string;
  user_id: string;
  holiday_date: string; // ISO date string YYYY-MM-DD
  description: string;
  is_exam_day: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceLog {
  id: string;
  user_id: string;
  subject_id: string;
  timetable_slot_id: string | null;
  log_date: string; // ISO date string YYYY-MM-DD
  status: AttendanceStatus;
  notes?: string | null;
  swapped_subject_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ==============================================================================
// MATH ENGINE & STATS TYPES
// ==============================================================================

export type SafeSkipStatus = 'SAFE' | 'WARNING' | 'DANGER';

export interface SubjectAttendanceStats {
  subject_id: string;
  subject_code: string;
  subject_name: string;
  is_lab: boolean;
  color_hex?: string;
  present: number;
  absent: number;
  cancelled: number;
  swapped: number;
  conducted: number;
  remaining: number;
  total_expected: number;
  current_percentage: number;
  safe_skips: number;
  classes_to_attend: number; // Consecutive classes required if in DANGER
  status: SafeSkipStatus;
  message: string;
}

export interface OverallSemesterStats {
  total_present: number;
  total_absent: number;
  total_conducted: number;
  total_remaining: number;
  overall_percentage: number;
  target_percentage: number;
  total_safe_skips: number;
  subjects_in_danger: number;
  status: SafeSkipStatus;
  hero_message: string;
  hero_subtext: string;
}

// ==============================================================================
// DASHBOARD & DAILY CARD TYPES
// ==============================================================================

export interface DailyClassItem {
  slot_id: string;
  subject_id: string;
  subject_code: string;
  subject_name: string;
  is_lab: boolean;
  color_hex?: string;
  start_time: string;
  end_time: string;
  room_number?: string | null;
  current_log?: AttendanceLog | null; // Log for today if already marked
  stats: SubjectAttendanceStats;
}

// ==============================================================================
// AI PARSER & ONBOARDING TYPES
// ==============================================================================

export interface AIExtractedSubject {
  temp_id: string;
  subject_code: string;
  subject_name: string;
  is_lab: boolean;
  credit_hours: number;
  confidence_score: number; // 0 to 100
  warning?: string;
}

export interface AIExtractedSlot {
  temp_id: string;
  subject_temp_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room_number?: string;
  confidence_score: number;
  warning?: string;
}

export interface AIExtractedHoliday {
  temp_id: string;
  holiday_date: string;
  description: string;
  is_exam_day: boolean;
  confidence_score: number;
}

export interface AIParsingResult {
  success: boolean;
  is_mock?: boolean;
  subjects: AIExtractedSubject[];
  timetable_slots: AIExtractedSlot[];
  academic_holidays: AIExtractedHoliday[];
  summary_message: string;
  raw_error?: string;
}

export interface OnboardingState {
  step: 'UPLOAD' | 'PROCESSING' | 'REVIEW' | 'COMPLETE';
  timetableImage: string | null;
  calendarImage: string | null;
  targetPercentage: number;
  semesterStartDate: string;
  semesterEndDate: string;
  extractedData: AIParsingResult | null;
}
