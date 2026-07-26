// ==============================================================================
// SKIPLY (ATTENDRA) — MATH ENGINE UNIT TESTS
// ==============================================================================
// Run with: npx tsx src/lib/__tests__/math-engine.test.ts

import assert from 'assert';
import { calculateSubjectStats, calculateRemainingLectures, calculateConductedTillDate } from '../math-engine';
import { Subject, TimetableSlot, AcademicHoliday } from '@/types';

const mockSubject: Subject = {
  id: 'sub-test-1',
  user_id: 'user-1',
  subject_code: 'CS-101',
  subject_name: 'Test Algorithms',
  is_lab: false,
  credit_hours: 3,
};

function runTests() {
  console.log('🧪 Starting Skiply Math Engine Verification Suite...\n');

  // Test 1: Standard Safe Skip Calculation (User Example 2)
  {
    // Present=38, Absent=7 -> Total=45 (remaining=0). Target=75%.
    // Safe Skips = floor((38 / 0.75) - 45) = floor(50.666... - 45) = 5.
    const result = calculateSubjectStats(mockSubject, 38, 7, 0, 0, 0, 75.0);
    assert.strictEqual(result.status, 'SAFE', 'Expected status to be SAFE');
    assert.strictEqual(result.safe_skips, 5, 'Expected exactly 5 safe skips');
    assert.strictEqual(result.current_percentage, 84.44, 'Expected current % around 84.44');
    console.log('✅ Test 1 Passed: Standard Safe Skip calculation (5 safe skips available)');
  }

  // Test 2: Borderline / Warning Zone
  {
    // Present=15, Absent=5 -> Total=20 (remaining=0). Target=75%.
    // Safe Skips = floor((15 / 0.75) - 20) = floor(20 - 20) = 0.
    const result = calculateSubjectStats(mockSubject, 15, 5, 0, 0, 0, 75.0);
    assert.strictEqual(result.status, 'WARNING', 'Expected status to be WARNING for <= 2 safe skips');
    assert.strictEqual(result.safe_skips, 0, 'Expected exactly 0 safe skips at border');
    console.log('✅ Test 2 Passed: Warning Zone detection (0 safe skips at border)');
  }

  // Test 3: Danger Zone Recovery (User Example: 4 done out of 30 total semester classes at 75% target)
  {
    // Present=4, Absent=6 -> Conducted=10. Remaining=20 -> Total Available=30. Target=75%.
    // Required total presents in sem = ceil(0.75 * 30) = 23.
    // Classes needed to attend = 23 - 4 = 19.
    const result = calculateSubjectStats(mockSubject, 4, 6, 0, 0, 20, 75.0);
    assert.strictEqual(result.status, 'DANGER', 'Expected status to be DANGER');
    assert.strictEqual(result.safe_skips, 0, 'Expected 0 safe skips in danger zone');
    assert.strictEqual(result.classes_to_attend, 19, 'Expected exactly 19 classes required to reach target');
    assert.strictEqual(
      result.message,
      'You are currently below your 75% target! Out of 30 total semester classes, you must attend 19 more class(es) to reach 76.7%.',
      'Expected exact AI message string'
    );
    console.log('✅ Test 3 Passed: Danger Zone semester recovery calculation (19 classes needed out of 30 total)');
  }

  // Test 4: Cancelled Class Dynamism (Does not penalize percentage or inflate conducted)
  {
    // 20 Present, 0 Absent, 5 Cancelled -> Total should be 20, Current % = 100%.
    const result = calculateSubjectStats(mockSubject, 20, 0, 5, 0, 0, 75.0);
    assert.strictEqual(result.conducted, 20, 'Cancelled classes should not increase conducted count');
    assert.strictEqual(result.current_percentage, 100.0, 'Cancelled classes should not penalize attendance %');
    assert.strictEqual(result.cancelled, 5, 'Cancelled count should be recorded accurately');
    console.log('✅ Test 4 Passed: Cancelled class dynamism (zero denominator distortion)');
  }

  // Test 5: Remaining Lectures Excludes Holidays & Non-scheduled Weekends
  {
    const slots: TimetableSlot[] = [
      { id: 'sl-1', user_id: 'u-1', subject_id: 'sub-test-1', day_of_week: 1, start_time: '09:00', end_time: '10:00' }, // Mon
      { id: 'sl-2', user_id: 'u-1', subject_id: 'sub-test-1', day_of_week: 3, start_time: '09:00', end_time: '10:00' }, // Wed
    ];

    // Reference time: A Sunday (day 0), let's say 2026-08-02
    const refDate = new Date('2026-08-02T12:00:00Z').getTime();
    // End date: 2 weeks later (2026-08-16), so 2 Mondays and 2 Wednesdays = 4 scheduled lectures
    const endDateStr = '2026-08-16';

    // Let's add a holiday on the second Monday (2026-08-10)
    const holidays: AcademicHoliday[] = [
      { id: 'hol-1', user_id: 'u-1', holiday_date: '2026-08-10', description: 'Summer Holiday', is_exam_day: false }
    ];

    const remaining = calculateRemainingLectures('sub-test-1', slots, holidays, endDateStr, refDate);
    assert.strictEqual(remaining, 3, 'Expected 3 remaining lectures (4 scheduled minus 1 holiday)');
    console.log('✅ Test 5 Passed: Remaining lectures exclusion of academic holidays and weekends');
  }

  // Test 6: Dynamic Conducted Till Date Calculation (User Example: July 1 to July 26 IoT with 1 holiday)
  {
    // IoT scheduled Mon (1), Wed (3), Fri (5). In July 2024 (1st is Mon), between July 1 and July 26 there are 12 scheduled lectures.
    const iotSlots: TimetableSlot[] = [
      { id: 'sl-iot-1', user_id: 'u-1', subject_id: 'sub-iot', day_of_week: 1, start_time: '10:00', end_time: '11:00' }, // Mon
      { id: 'sl-iot-2', user_id: 'u-1', subject_id: 'sub-iot', day_of_week: 3, start_time: '10:00', end_time: '11:00' }, // Wed
      { id: 'sl-iot-3', user_id: 'u-1', subject_id: 'sub-iot', day_of_week: 5, start_time: '10:00', end_time: '11:00' }, // Fri
    ];

    const holidays: AcademicHoliday[] = [
      { id: 'hol-iot-1', user_id: 'u-1', holiday_date: '2024-07-15', description: 'Monday Holiday', is_exam_day: false }
    ];

    const startDateStr = '2024-07-01';
    const todayMs = new Date('2024-07-26T12:00:00Z').getTime();

    // 12 scheduled minus 1 holiday = 11 conducted till date
    const conductedTillDate = calculateConductedTillDate('sub-iot', iotSlots, holidays, startDateStr, todayMs);
    assert.strictEqual(conductedTillDate, 11, 'Expected exactly 11 conducted lectures (12 scheduled minus 1 holiday)');

    // Attended 9 out of 11 conducted -> 81.8%
    const result = calculateSubjectStats(mockSubject, 9, 2, 0, 0, 34, 75.0);
    assert.strictEqual(Number(result.current_percentage.toFixed(1)), 81.8, 'Expected attendance percentage to be 81.8%');
    console.log('✅ Test 6 Passed: Dynamic Conducted Till Date calculation (11 conducted, 81.8% attendance)');
  }

  console.log('\n🎉 ALL 6 MATH ENGINE VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

runTests();
