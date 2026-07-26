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
  defaultTargetPct: number = 75.0,
  conductedOverride?: number
): SubjectAttendanceStats {
  const conducted = (conductedOverride !== undefined && conductedOverride >= 0) ? conductedOverride : (present + absent);
  const effectiveAbsent = (conductedOverride !== undefined && conductedOverride >= 0) ? Math.max(0, conducted - present) : absent;
  // Total = Total Class Available (conducted + remaining if known, otherwise conducted)
  const totalAvailable = (conducted + remaining) > 0 ? (conducted + remaining) : conducted;
  const totalExpected = totalAvailable;

  const targetPct = (subject.target_attendance_percentage && subject.target_attendance_percentage > 0)
    ? subject.target_attendance_percentage
    : defaultTargetPct;
  const targetDec = targetPct / 100.0;

  // Formula 1: Percentage = (Attended / Classes Conducted Till Present Date) * 100
  const currentPct = conducted === 0 ? 100.0 : (present / conducted) * 100.0;

  // Required total attended classes in the semester to reach target %
  const requiredTotalPresents = Math.ceil(targetDec * totalAvailable);
  const neededMore = requiredTotalPresents - present;

  // Formula 2: Safe Skips Available (from current standing)
  let safeSkips = 0;
  if (totalAvailable > 0 && targetDec > 0 && targetDec <= 1.0) {
    safeSkips = Math.floor((present / targetDec) - totalAvailable);
  }

  let status: SafeSkipStatus = 'SAFE';
  let classesToAttend = 0;
  let message = '';

  if (safeSkips >= 0) {
    if (safeSkips === 0) {
      status = 'WARNING';
      message = `You are right at the border of ${targetPct}%! You cannot skip any more classes without dropping below your target.`;
    } else if (safeSkips <= 2) {
      status = 'WARNING';
      message = `Use caution: You can only skip ${safeSkips} more class(es) this semester while maintaining ${targetPct}%.`;
    } else {
      status = 'SAFE';
      const futureTotal = totalAvailable + safeSkips;
      const futurePct = futureTotal > 0 ? (present / futureTotal) * 100.0 : 100.0;
      message = `You can safely skip up to ${safeSkips} more class(es). If you skip ${safeSkips} class(es), your attendance will be ${Number(futurePct.toFixed(1))}%, keeping you safely above your ${targetPct}% requirement!`;
    }
  } else {
    // Formula 3: Classes Needed to Recover (Danger Zone)
    status = 'DANGER';
    classesToAttend = Math.max(1, neededMore > 0 ? neededMore : 1);
    
    const futurePresent = present + classesToAttend;
    const futurePct = totalAvailable > 0 ? (futurePresent / totalAvailable) * 100.0 : 100.0;
    message = `You are currently below your ${targetPct}% target! Out of ${totalAvailable} total semester classes, you must attend ${classesToAttend} more class(es) to reach ${Number(futurePct.toFixed(1))}%.`;
  }

  return {
    subject_id: subject.id,
    subject_code: subject.subject_code,
    subject_name: subject.subject_name,
    is_lab: subject.is_lab,
    color_hex: subject.color_hex,
    present,
    absent: effectiveAbsent,
    cancelled,
    swapped,
    conducted,
    remaining,
    total_expected: totalExpected,
    total_available: totalAvailable,
    current_percentage: Number(currentPct.toFixed(2)),
    safe_skips: Math.max(0, safeSkips),
    classes_to_attend: classesToAttend,
    status,
    message,
  };
}

/**
 * Calculates how many lectures should have been conducted for a subject from semester_start_date until today (or reference date),
 * by reading the timetable, counting scheduled lecture days, ignoring holidays, and applying extra/cancelled class modifications.
 */
export function calculateConductedTillDate(
  subjectId: string,
  slots: TimetableSlot[],
  holidays: AcademicHoliday[],
  startDateStr: string,
  toTimeMs: number = Date.now(),
  extraClasses: number = 0,
  cancelledClasses: number = 0
): number {
  const subjectSlots = slots.filter(s => s.subject_id === subjectId);
  if (subjectSlots.length === 0) return Math.max(0, extraClasses - cancelledClasses);

  const activeDaysOfWeek = new Set(subjectSlots.map(s => s.day_of_week));
  const holidayDates = new Set(holidays.map(h => h.holiday_date));

  const start = new Date(startDateStr);
  start.setHours(0, 0, 0, 0);

  const end = new Date(toTimeMs);
  end.setHours(23, 59, 59, 999);

  if (start > end) return Math.max(0, extraClasses - cancelledClasses);

  let conductedCount = 0;
  const curr = new Date(start);
  while (curr <= end) {
    const year = curr.getFullYear();
    const month = String(curr.getMonth() + 1).padStart(2, '0');
    const day = String(curr.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayOfWeek = curr.getDay();

    if (!holidayDates.has(dateStr) && activeDaysOfWeek.has(dayOfWeek)) {
      const slotsOnDay = subjectSlots.filter(s => s.day_of_week === dayOfWeek).length;
      conductedCount += slotsOnDay;
    }

    curr.setDate(curr.getDate() + 1);
  }

  return Math.max(0, conductedCount + extraClasses - cancelledClasses);
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
  endDateStr: string = new Date(Date.now() + 86400000 * 90).toISOString().split('T')[0],
  startDateStr?: string
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
    const conductedTillDate = startDateStr ? calculateConductedTillDate(sub.id, slots, holidays, startDateStr, Date.now(), 0, cancelled) : undefined;

    const stats = calculateSubjectStats(sub, present, absent, cancelled, swapped, remaining, targetPct, conductedTillDate);

    totalPresent += present;
    totalAbsent += stats.absent;
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
