// ==============================================================================
// SKIPLY (ATTENDRA) — LOCAL DEMO / GUEST MODE STORE
// ==============================================================================
// Enables instant zero-config testing and offline guest usage without cloud keys.

import { Profile, Subject, TimetableSlot, AcademicHoliday, AttendanceLog, AttendanceStatus } from '@/types';

const DEMO_KEYS = {
  PROFILE: 'skiply_demo_profile_v1',
  SUBJECTS: 'skiply_demo_subjects_v1',
  SLOTS: 'skiply_demo_slots_v1',
  HOLIDAYS: 'skiply_demo_holidays_v1',
  LOGS: 'skiply_demo_logs_v1',
  ONBOARDED: 'skiply_demo_onboarded_v1',
};

// Default sample data for instant showcase
const DEFAULT_PROFILE: Profile = {
  id: 'demo-user-id-1234',
  full_name: 'Alex Mercer (Demo Student)',
  email: 'alex.mercer@univ.edu',
  target_attendance_percentage: 75.0,
  semester_start_date: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
  semester_end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 2, 28).toISOString().split('T')[0],
  schedule_type: 'STANDARD_WEEK',
};

const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'sub-cs101', user_id: 'demo-user-id-1234', subject_code: 'CS-101', subject_name: 'Data Structures & Algorithms', is_lab: false, credit_hours: 4, color_hex: '#6366f1' },
  { id: 'sub-cs101L', user_id: 'demo-user-id-1234', subject_code: 'CS-101 (Lab)', subject_name: 'Algorithms Lab', is_lab: true, credit_hours: 2, color_hex: '#8b5cf6' },
  { id: 'sub-math201', user_id: 'demo-user-id-1234', subject_code: 'MATH-201', subject_name: 'Discrete Mathematics', is_lab: false, credit_hours: 3, color_hex: '#06b6d4' },
  { id: 'sub-phy101', user_id: 'demo-user-id-1234', subject_code: 'PHY-101', subject_name: 'Engineering Physics', is_lab: false, credit_hours: 3, color_hex: '#10b981' },
  { id: 'sub-hum102', user_id: 'demo-user-id-1234', subject_code: 'HUM-102', subject_name: 'Technical Communication', is_lab: false, credit_hours: 2, color_hex: '#f59e0b' },
];

const DEFAULT_SLOTS: TimetableSlot[] = [
  // Monday (1)
  { id: 'slot-mon-1', user_id: 'demo-user-id-1234', subject_id: 'sub-cs101', day_of_week: 1, start_time: '09:00', end_time: '10:00', room_number: 'LT-301' },
  { id: 'slot-mon-2', user_id: 'demo-user-id-1234', subject_id: 'sub-math201', day_of_week: 1, start_time: '10:00', end_time: '11:00', room_number: 'LT-204' },
  { id: 'slot-mon-3', user_id: 'demo-user-id-1234', subject_id: 'sub-phy101', day_of_week: 1, start_time: '11:15', end_time: '12:15', room_number: 'LT-102' },
  // Tuesday (2)
  { id: 'slot-tue-1', user_id: 'demo-user-id-1234', subject_id: 'sub-cs101L', day_of_week: 2, start_time: '14:00', end_time: '16:00', room_number: 'Lab-3B' },
  { id: 'slot-tue-2', user_id: 'demo-user-id-1234', subject_id: 'sub-hum102', day_of_week: 2, start_time: '10:00', end_time: '11:00', room_number: 'Sem-Hall-1' },
  // Wednesday (3)
  { id: 'slot-wed-1', user_id: 'demo-user-id-1234', subject_id: 'sub-cs101', day_of_week: 3, start_time: '09:00', end_time: '10:00', room_number: 'LT-301' },
  { id: 'slot-wed-2', user_id: 'demo-user-id-1234', subject_id: 'sub-math201', day_of_week: 3, start_time: '10:00', end_time: '11:00', room_number: 'LT-204' },
  { id: 'slot-wed-3', user_id: 'demo-user-id-1234', subject_id: 'sub-phy101', day_of_week: 3, start_time: '11:15', end_time: '12:15', room_number: 'LT-102' },
  // Thursday (4)
  { id: 'slot-thu-1', user_id: 'demo-user-id-1234', subject_id: 'sub-math201', day_of_week: 4, start_time: '09:00', end_time: '10:00', room_number: 'LT-204' },
  { id: 'slot-thu-2', user_id: 'demo-user-id-1234', subject_id: 'sub-hum102', day_of_week: 4, start_time: '11:00', end_time: '12:00', room_number: 'Sem-Hall-1' },
  // Friday (5)
  { id: 'slot-fri-1', user_id: 'demo-user-id-1234', subject_id: 'sub-cs101', day_of_week: 5, start_time: '09:00', end_time: '10:00', room_number: 'LT-301' },
  { id: 'slot-fri-2', user_id: 'demo-user-id-1234', subject_id: 'sub-phy101', day_of_week: 5, start_time: '10:00', end_time: '11:00', room_number: 'LT-102' },
];

const DEFAULT_HOLIDAYS: AcademicHoliday[] = [
  { id: 'hol-1', user_id: 'demo-user-id-1234', holiday_date: new Date(new Date().getTime() + 86400000 * 7).toISOString().split('T')[0], description: 'Mid-Semester Break', is_exam_day: false },
  { id: 'hol-2', user_id: 'demo-user-id-1234', holiday_date: new Date(new Date().getTime() + 86400000 * 14).toISOString().split('T')[0], description: 'National Holiday', is_exam_day: false },
];

// Generate some sample past attendance logs so Safe Skip calculator has meaningful numbers
function generateSampleLogs(): AttendanceLog[] {
  const logs: AttendanceLog[] = [];
  const today = new Date();
  const startDate = new Date(DEFAULT_PROFILE.semester_start_date);
  
  let curr = new Date(startDate);
  while (curr < today) {
    const dayOfWeek = curr.getDay();
    const dateStr = curr.toISOString().split('T')[0];
    
    // Check if slot existed on this day
    const daySlots = DEFAULT_SLOTS.filter(s => s.day_of_week === dayOfWeek);
    for (const slot of daySlots) {
      // 85% chance present, 10% absent, 5% cancelled
      const rand = Math.random();
      let status: AttendanceStatus = 'PRESENT';
      if (rand > 0.90) status = 'CANCELLED';
      else if (rand > 0.75) status = 'ABSENT';
      
      logs.push({
        id: `log-${dateStr}-${slot.id}`,
        user_id: 'demo-user-id-1234',
        subject_id: slot.subject_id,
        timetable_slot_id: slot.id,
        log_date: dateStr,
        status,
      });
    }
    curr.setDate(curr.getDate() + 1);
  }
  return logs;
}

// Helpers for localStorage access
export function getDemoProfile(): Profile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  const saved = localStorage.getItem(DEMO_KEYS.PROFILE);
  if (!saved) {
    localStorage.setItem(DEMO_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
    return DEFAULT_PROFILE;
  }
  try { return JSON.parse(saved); } catch { return DEFAULT_PROFILE; }
}

export function saveDemoProfile(profile: Profile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEMO_KEYS.PROFILE, JSON.stringify(profile));
}

export function getDemoSubjects(): Subject[] {
  if (typeof window === 'undefined') return DEFAULT_SUBJECTS;
  const saved = localStorage.getItem(DEMO_KEYS.SUBJECTS);
  if (!saved) {
    localStorage.setItem(DEMO_KEYS.SUBJECTS, JSON.stringify(DEFAULT_SUBJECTS));
    return DEFAULT_SUBJECTS;
  }
  try { return JSON.parse(saved); } catch { return DEFAULT_SUBJECTS; }
}

export function saveDemoSubjects(subjects: Subject[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEMO_KEYS.SUBJECTS, JSON.stringify(subjects));
}

export function getDemoTimetableSlots(): TimetableSlot[] {
  if (typeof window === 'undefined') return DEFAULT_SLOTS;
  const saved = localStorage.getItem(DEMO_KEYS.SLOTS);
  if (!saved) {
    localStorage.setItem(DEMO_KEYS.SLOTS, JSON.stringify(DEFAULT_SLOTS));
    return DEFAULT_SLOTS;
  }
  try { return JSON.parse(saved); } catch { return DEFAULT_SLOTS; }
}

export function saveDemoTimetableSlots(slots: TimetableSlot[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEMO_KEYS.SLOTS, JSON.stringify(slots));
}

export function getDemoHolidays(): AcademicHoliday[] {
  if (typeof window === 'undefined') return DEFAULT_HOLIDAYS;
  const saved = localStorage.getItem(DEMO_KEYS.HOLIDAYS);
  if (!saved) {
    localStorage.setItem(DEMO_KEYS.HOLIDAYS, JSON.stringify(DEFAULT_HOLIDAYS));
    return DEFAULT_HOLIDAYS;
  }
  try { return JSON.parse(saved); } catch { return DEFAULT_HOLIDAYS; }
}

export function saveDemoHolidays(holidays: AcademicHoliday[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEMO_KEYS.HOLIDAYS, JSON.stringify(holidays));
}

export function getDemoAttendanceLogs(): AttendanceLog[] {
  if (typeof window === 'undefined') {
    return [];
  }
  const saved = localStorage.getItem(DEMO_KEYS.LOGS);
  if (!saved) {
    const sample = generateSampleLogs();
    localStorage.setItem(DEMO_KEYS.LOGS, JSON.stringify(sample));
    return sample;
  }
  try { return JSON.parse(saved); } catch { return []; }
}

export function saveDemoAttendanceLog(log: AttendanceLog): AttendanceLog[] {
  if (typeof window === 'undefined') return [];
  const logs = getDemoAttendanceLogs();
  const existingIdx = logs.findIndex(
    l => l.subject_id === log.subject_id && l.timetable_slot_id === log.timetable_slot_id && l.log_date === log.log_date
  );
  if (existingIdx >= 0) {
    logs[existingIdx] = log;
  } else {
    logs.push(log);
  }
  localStorage.setItem(DEMO_KEYS.LOGS, JSON.stringify(logs));
  return logs;
}

export function removeDemoAttendanceLog(slotId: string, dateStr: string): AttendanceLog[] {
  if (typeof window === 'undefined') return [];
  const logs = getDemoAttendanceLogs().filter(l => !(l.timetable_slot_id === slotId && l.log_date === dateStr));
  localStorage.setItem(DEMO_KEYS.LOGS, JSON.stringify(logs));
  return logs;
}

export function isOnboardedInDemo(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DEMO_KEYS.ONBOARDED) === 'true';
}

export function setOnboardedInDemo(val: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEMO_KEYS.ONBOARDED, val ? 'true' : 'false');
}

export function resetDemoData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DEMO_KEYS.PROFILE);
  localStorage.removeItem(DEMO_KEYS.SUBJECTS);
  localStorage.removeItem(DEMO_KEYS.SLOTS);
  localStorage.removeItem(DEMO_KEYS.HOLIDAYS);
  localStorage.removeItem(DEMO_KEYS.LOGS);
  localStorage.removeItem(DEMO_KEYS.ONBOARDED);
}

// Save AI confirmed schedule into local demo store
export function saveConfirmedScheduleToDemo(
  subjects: Subject[],
  slots: TimetableSlot[],
  holidays: AcademicHoliday[],
  targetPercentage: number,
  startDate: string,
  endDate: string
): void {
  if (typeof window === 'undefined') return;
  const prof = getDemoProfile();
  prof.target_attendance_percentage = targetPercentage;
  prof.semester_start_date = startDate;
  prof.semester_end_date = endDate;
  
  saveDemoProfile(prof);
  saveDemoSubjects(subjects);
  saveDemoTimetableSlots(slots);
  saveDemoHolidays(holidays);
  localStorage.setItem(DEMO_KEYS.LOGS, JSON.stringify([])); // Start with fresh attendance for newly uploaded schedule
  setOnboardedInDemo(true);
}
