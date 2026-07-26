// ==============================================================================
// SKIPLY (ATTENDRA) — DETERMINISTIC MATH ENGINE ("SAFE SKIPS" ALGORITHM)
// ==============================================================================
// 100% deterministic code. Never use an LLM for attendance math calculations.

import { 
  Subject, TimetableSlot, AcademicHoliday, AttendanceLog, 
  SubjectAttendanceStats, OverallSemesterStats, SafeSkipStatus 
} from '@/types';

/**
 * Calculates deterministic safe skips and recovery requirements for a single subject.
 */
export function calculateSubjectStats(
  subject: Subject,
  present: number,
  absent: number,
  cancelled: number,
  swapped: number,
  remaining: number,
  targetPct: number = 75.0
): SubjectAttendanceStats {
  const conducted = present + absent;
  const totalExpected = conducted + remaining;

  // Formula 1: Current Percentage
  const currentPct = conducted === 0 ? 100.0 : (present / conducted) * 100.0;

  // Formula 2: Safe Skips Available
  // We want: (P + remaining - S) / totalExpected >= (targetPct / 100.0)
  // S = floor( P + remaining - (targetPct / 100.0) * totalExpected )
  const requiredPresents = (targetPct / 100.0) * totalExpected;
  const safeSkips = Math.floor(present + remaining - requiredPresents);

  let status: SafeSkipStatus = 'SAFE';
  let classesToAttend = 0;
  let message = '';

  if (safeSkips >= 0) {
    if (safeSkips === 0) {
      status = 'WARNING';
      message = `You are right at the border! Attend tomorrow's lecture to maintain ${targetPct}%.`;
    } else if (safeSkips <= 2) {
      status = 'WARNING';
      message = `Use caution: You can only skip ${safeSkips} more class(es) this semester.`;
    } else {
      status = 'SAFE';
      message = `You can safely skip ${safeSkips} more class(es) this semester while staying above ${targetPct}%.`;
    }
  } else {
    // Formula 3: Classes Needed to Recover (Danger Zone)
    // We want: (P + N) / (conducted + N) >= (targetPct / 100.0)
    // N = ceil( ((targetPct / 100.0) * conducted - P) / (1 - (targetPct / 100.0)) )
    status = 'DANGER';
    const targetDec = targetPct / 100.0;
    
    // Avoid division by zero if target is 100%
    if (targetDec >= 1.0) {
      classesToAttend = remaining;
    } else {
      classesToAttend = Math.max(1, Math.ceil((targetDec * conducted - present) / (1.0 - targetDec)));
    }
    
    message = `Critical! Attend the next ${classesToAttend} class(es) consecutively to reach ${targetPct}%.`;
  }

  return {
    subject_id: subject.id,
    subject_code: subject.subject_code,
    subject_name: subject.subject_name,
    is_lab: subject.is_lab,
    color_hex: subject.color_hex,
    present,
    absent,
    cancelled,
    swapped,
    conducted,
    remaining,
    total_expected: totalExpected,
    current_percentage: Number(currentPct.toFixed(2)),
    safe_skips: Math.max(0, safeSkips),
    classes_to_attend: classesToAttend,
    status,
    message,
  };
}

/**
 * Calculates remaining scheduled lectures between a reference date (default tomorrow) and semester_end_date,
 * excluding weekends without classes and dates present in academic_holidays.
 */
export function calculateRemainingLectures(
  subjectId: string,
  slots: TimetableSlot[],
  holidays: AcademicHoliday[],
  endDateStr: string,
  fromTimeMs: number = Date.now()
): number {
  const subjectSlots = slots.filter(s => s.subject_id === subjectId);
  if (subjectSlots.length === 0) return 0;

  const activeDaysOfWeek = new Set(subjectSlots.map(s => s.day_of_week));
  const holidayDates = new Set(holidays.map(h => h.holiday_date));

  // Start checking from tomorrow
  const curr = new Date(fromTimeMs);
  curr.setDate(curr.getDate() + 1);
  curr.setHours(0, 0, 0, 0);

  const end = new Date(endDateStr);
  end.setHours(23, 59, 59, 999);

  if (curr > end) return 0;

  let remainingCount = 0;
  while (curr <= end) {
    const year = curr.getFullYear();
    const month = String(curr.getMonth() + 1).padStart(2, '0');
    const day = String(curr.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayOfWeek = curr.getDay();

    if (!holidayDates.has(dateStr) && activeDaysOfWeek.has(dayOfWeek)) {
      // Count how many slots for this subject occur on this day of week
      const slotsOnDay = subjectSlots.filter(s => s.day_of_week === dayOfWeek).length;
      remainingCount += slotsOnDay;
    }

    curr.setDate(curr.getDate() + 1);
  }

  return remainingCount;
}

/**
 * Generates overall semester metrics across all enrolled subjects for the hero dashboard card.
 */
export function calculateOverallSemesterStats(
  subjects: Subject[],
  slots: TimetableSlot[],
  holidays: AcademicHoliday[],
  logs: AttendanceLog[],
  targetPct: number = 75.0,
  endDateStr: string = new Date(Date.now() + 86400000 * 90).toISOString().split('T')[0]
): { overall: OverallSemesterStats; subjectStats: SubjectAttendanceStats[] } {
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalConducted = 0;
  let totalRemaining = 0;
  let totalSafeSkips = 0;
  let subjectsInDanger = 0;

  const subjectStats: SubjectAttendanceStats[] = subjects.map(sub => {
    const subLogs = logs.filter(l => l.subject_id === sub.id);
    const present = subLogs.filter(l => l.status === 'PRESENT').length;
    const absent = subLogs.filter(l => l.status === 'ABSENT').length;
    const cancelled = subLogs.filter(l => l.status === 'CANCELLED').length;
    const swapped = subLogs.filter(l => l.status === 'SWAPPED').length;
    const remaining = calculateRemainingLectures(sub.id, slots, holidays, endDateStr);

    const stats = calculateSubjectStats(sub, present, absent, cancelled, swapped, remaining, targetPct);

    totalPresent += present;
    totalAbsent += absent;
    totalConducted += stats.conducted;
    totalRemaining += remaining;
    if (stats.status === 'SAFE') {
      totalSafeSkips += stats.safe_skips;
    } else if (stats.status === 'DANGER') {
      subjectsInDanger += 1;
    }

    return stats;
  });

  const overallPct = totalConducted === 0 ? 100.0 : (totalPresent / totalConducted) * 100.0;

  let overallStatus: SafeSkipStatus = 'SAFE';
  let heroMessage = '';
  let heroSubtext = '';

  if (subjectsInDanger > 0) {
    overallStatus = 'DANGER';
    heroMessage = `Attention Needed: ${subjectsInDanger} Subject${subjectsInDanger > 1 ? 's' : ''} Below Target`;
    heroSubtext = `Your overall attendance is ${overallPct.toFixed(1)}%. Focus on attending your upcoming lectures in the red subjects below.`;
  } else if (totalSafeSkips === 0) {
    overallStatus = 'WARNING';
    heroMessage = `Zero Buffer Available`;
    heroSubtext = `You are meeting the ${targetPct}% requirement, but skipping any class tomorrow will drop you into the danger zone.`;
  } else {
    overallStatus = 'SAFE';
    heroMessage = `You Can Safely Skip ${totalSafeSkips} More Class${totalSafeSkips !== 1 ? 'es' : ''}`;
    heroSubtext = `Your overall attendance is a strong ${overallPct.toFixed(1)}%, well above your ${targetPct}% requirement. Enjoy your free time responsibly!`;
  }

  return {
    overall: {
      total_present: totalPresent,
      total_absent: totalAbsent,
      total_conducted: totalConducted,
      total_remaining: totalRemaining,
      overall_percentage: Number(overallPct.toFixed(2)),
      target_percentage: targetPct,
      total_safe_skips: totalSafeSkips,
      subjects_in_danger: subjectsInDanger,
      status: overallStatus,
      hero_message: heroMessage,
      hero_subtext: heroSubtext,
    },
    subjectStats,
  };
}
