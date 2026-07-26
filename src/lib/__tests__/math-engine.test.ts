// ==============================================================================
// SKIPLY (ATTENDRA) — MATH ENGINE UNIT TESTS
// ==============================================================================
// Run with: npx tsx src/lib/__tests__/math-engine.test.ts

import assert from 'assert';
import { calculateSubjectStats, calculateRemainingLectures } from '../math-engine';
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

  // Test 1: Standard Safe Skip Calculation
  {
    // Present=30, Absent=5 -> Conducted=35. Remaining=20. Target=75%.
    // Total Expected = 55. Required Presents = 55 * 0.75 = 41.25.
    // Safe Skips = floor(30 + 20 - 41.25) = floor(8.75) = 8.
    const result = calculateSubjectStats(mockSubject, 30, 5, 0, 0, 20, 75.0);
    assert.strictEqual(result.status, 'SAFE', 'Expected status to be SAFE');
    assert.strictEqual(result.safe_skips, 8, 'Expected exactly 8 safe skips');
    assert.strictEqual(result.current_percentage, 85.71, 'Expected current % around 85.71');
    console.log('✅ Test 1 Passed: Standard Safe Skip calculation (8 safe skips available)');
  }

  // Test 2: Borderline / Warning Zone
  {
    // Present=15, Absent=5 -> Conducted=20. Remaining=10. Target=75%.
    // Total Expected = 30. Required Presents = 30 * 0.75 = 22.5.
    // Safe Skips = floor(15 + 10 - 22.5) = floor(2.5) = 2.
    const result = calculateSubjectStats(mockSubject, 15, 5, 0, 0, 10, 75.0);
    assert.strictEqual(result.status, 'WARNING', 'Expected status to be WARNING for <= 2 safe skips');
    assert.strictEqual(result.safe_skips, 2, 'Expected exactly 2 safe skips');
    console.log('✅ Test 2 Passed: Warning Zone detection (<= 2 safe skips)');
  }

  // Test 3: Danger Zone & Consecutive Classes Recovery
  {
    // Present=10, Absent=10 -> Conducted=20 (50% attendance). Remaining=15. Target=75%.
    // S = floor(10 + 15 - 0.75*35) = floor(25 - 26.25) = -2 (S < 0 -> DANGER ZONE).
    // N = ceil( (0.75 * 20 - 10) / (1 - 0.75) ) = ceil( (15 - 10) / 0.25 ) = ceil(20) = 20.
    const result = calculateSubjectStats(mockSubject, 10, 10, 0, 0, 15, 75.0);
    assert.strictEqual(result.status, 'DANGER', 'Expected status to be DANGER');
    assert.strictEqual(result.safe_skips, 0, 'Expected 0 safe skips in danger zone');
    assert.strictEqual(result.classes_to_attend, 20, 'Expected 20 consecutive classes required to reach 75%');
    console.log('✅ Test 3 Passed: Danger Zone consecutive class recovery calculation (20 classes needed)');
  }

  // Test 4: Cancelled Class Dynamism (Does not penalize percentage or inflate conducted)
  {
    // 20 Present, 0 Absent, 5 Cancelled -> Conducted should be 20, Current % = 100%.
    const result = calculateSubjectStats(mockSubject, 20, 0, 5, 0, 15, 75.0);
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

  console.log('\n🎉 ALL 5 MATH ENGINE VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

runTests();
