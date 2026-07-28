'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================================================
// 1. PROFILE & SEMESTER DATES
// ============================================================================
export async function getUserProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function updateSemesterDates(startDate: string, endDate: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('profiles')
    .upsert({ 
      id: user.id,
      full_name: user.user_metadata?.full_name || 'Student',
      email: user.email,
      semester_start_date: startDate, 
      semester_end_date: endDate 
    }, { onConflict: 'id' })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateSemesterConfig(targetPct: number, startDate: string, endDate: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('profiles')
    .upsert({ 
      id: user.id,
      full_name: user.user_metadata?.full_name || 'Student',
      email: user.email,
      target_attendance_percentage: targetPct,
      semester_start_date: startDate, 
      semester_end_date: endDate 
    }, { onConflict: 'id' })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
  return { success: true }
}

// ============================================================================
// 2. ONBOARDING: BATCH SAVE TIMETABLE & HOLIDAYS
// ============================================================================
export async function saveOnboardingData(payload: {
  subjects: { code: string; name: string; is_lab: boolean }[]
  slots: { subject_code: string; day_of_week: number; start_time: string; end_time: string; room?: string }[]
  holidays: { date: string; name: string }[]
  startDate: string
  endDate: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // A. Upsert profile with semester dates to ensure foreign key constraint passes
  const { error: profErr } = await supabase.from('profiles').upsert({
    id: user.id,
    full_name: user.user_metadata?.full_name || 'Student',
    email: user.email,
    semester_start_date: payload.startDate,
    semester_end_date: payload.endDate,
  }, { onConflict: 'id' })

  if (profErr) {
    const { error: insErr } = await supabase.from('profiles').insert({
      id: user.id,
      full_name: user.user_metadata?.full_name || 'Student',
      email: user.email,
      target_attendance_percentage: 75.0,
      semester_start_date: payload.startDate,
      semester_end_date: payload.endDate,
    });
    if (insErr) {
      throw new Error(`Profile creation failed (${profErr.message} / ${insErr.message}). Check RLS policies.`);
    }
  }

  // Clean up any existing subjects, slots, and holidays for clean re-onboarding if needed
  await Promise.all([
    supabase.from('timetable_slots').delete().eq('user_id', user.id),
    supabase.from('holidays').delete().eq('user_id', user.id).then(async (res) => {
      if (res.error && res.error.message?.includes('does not exist')) {
        await supabase.from('academic_holidays').delete().eq('user_id', user.id);
      }
    }),
    supabase.from('subjects').delete().eq('user_id', user.id)
  ]);

  // B. Insert Subjects
  const subjectsToInsert = payload.subjects.map(s => ({
    user_id: user.id,
    subject_code: s.code.trim(),
    subject_name: s.name.trim(),
    is_lab: s.is_lab,
  }))

  const { data: insertedSubjects, error: subError } = await supabase
    .from('subjects')
    .insert(subjectsToInsert)
    .select()

  if (subError || !insertedSubjects) throw new Error(subError?.message || 'Failed to insert subjects')

  // Create a map of subject_code -> subject_id
  const subjectMap = new Map(insertedSubjects.map(s => [s.subject_code.trim().toLowerCase(), s.id]))

  // C. Insert Timetable Slots
  const slotsToInsert = payload.slots.map(slot => ({
    user_id: user.id,
    subject_id: subjectMap.get(slot.subject_code.trim().toLowerCase()),
    day_of_week: slot.day_of_week,
    start_time: slot.start_time,
    end_time: slot.end_time,
    room_number: slot.room || '',
  })).filter(slot => slot.subject_id) // Ensure valid mapping

  if (slotsToInsert.length > 0) {
    const { error: slotError } = await supabase
      .from('timetable_slots')
      .insert(slotsToInsert)

    if (slotError) throw new Error(slotError.message)
  }

  // D. Insert Holidays
  if (payload.holidays.length > 0) {
    const holidaysToInsert = payload.holidays.map(h => ({
      user_id: user.id,
      holiday_date: h.date,
      holiday_name: h.name,
    }))
    const { error: holError } = await supabase.from('holidays').insert(holidaysToInsert)
    if (holError && holError.message?.includes('does not exist')) {
      const oldHolidaysToInsert = payload.holidays.map(h => ({
        user_id: user.id,
        holiday_date: h.date,
        description: h.name,
      }))
      await supabase.from('academic_holidays').insert(oldHolidaysToInsert)
    } else if (holError) {
      throw new Error(holError.message)
    }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// ============================================================================
// 3. DAILY ATTENDANCE MARKING (SINGLE-TAP)
// ============================================================================
export async function markAttendance(payload: {
  subjectId: string
  timetableSlotId: string | null
  logDate: string // YYYY-MM-DD
  status: 'PRESENT' | 'ABSENT' | 'CANCELLED'
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Upsert ensures we overwrite if the student changes their mind (e.g., Absent -> Present)
  const { error } = await supabase
    .from('attendance_logs')
    .upsert({
      user_id: user.id,
      subject_id: payload.subjectId,
      timetable_slot_id: payload.timetableSlotId,
      log_date: payload.logDate,
      status: payload.status,
    }, {
      onConflict: 'user_id,subject_id,timetable_slot_id,log_date'
    })

  if (error) throw new Error(error.message)
  
  revalidatePath('/dashboard')
  revalidatePath('/history')
  revalidatePath('/calendar')
  revalidatePath('/analytics')
  return { success: true }
}

export async function removeAttendance(payload: {
  subjectId: string
  timetableSlotId: string | null
  logDate: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  let query = supabase
    .from('attendance_logs')
    .delete()
    .eq('user_id', user.id)
    .eq('subject_id', payload.subjectId)
    .eq('log_date', payload.logDate)
    
  if (payload.timetableSlotId) {
    query = query.eq('timetable_slot_id', payload.timetableSlotId)
  } else {
    query = query.is('timetable_slot_id', null)
  }

  const { error } = await query
  if (error) throw new Error(error.message)
  
  revalidatePath('/dashboard')
  revalidatePath('/history')
  return { success: true }
}

// ============================================================================
// 4. DATA FETCHING FOR DASHBOARD & CALENDAR
// ============================================================================
export async function getDailySchedule(dayOfWeek: number, dateStr: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { isHoliday: false, holidayName: null, slots: [] }

  // Check if today is a holiday
  let { data: holiday, error: holErr } = await supabase
    .from('holidays')
    .select('*')
    .eq('user_id', user.id)
    .eq('holiday_date', dateStr)
    .maybeSingle()

  if (holErr && holErr.message?.includes('does not exist')) {
    const oldRes = await supabase
      .from('academic_holidays')
      .select('*')
      .eq('user_id', user.id)
      .eq('holiday_date', dateStr)
      .maybeSingle()
    holiday = oldRes.data ? { ...oldRes.data, holiday_name: oldRes.data.description } : null
  }

  if (holiday) return { isHoliday: true, holidayName: holiday.holiday_name, slots: [] }

  // Fetch slots for this day of the week with joined subject details
  const { data: slots, error: slotsError } = await supabase
    .from('timetable_slots')
    .select(`
      *,
      subjects (id, subject_code, subject_name, is_lab)
    `)
    .eq('user_id', user.id)
    .eq('day_of_week', dayOfWeek)
    .order('start_time', { ascending: true })

  if (slotsError) throw new Error(slotsError.message)

  // Fetch existing attendance logs for this specific date
  const { data: logs } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('log_date', dateStr)

  // Merge logs into slots so UI knows button active states
  const mergedSlots = slots.map(slot => {
    const log = logs?.find(l => l.timetable_slot_id === slot.id)
    return {
      ...slot,
      currentStatus: log ? log.status : null,
    }
  })

  return { isHoliday: false, holidayName: null, slots: mergedSlots }
}

export async function getMonthAttendanceLogs(year: number, month: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Format start and end of the month (YYYY-MM-DD)
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`

  const { data: logs, error } = await supabase
    .from('attendance_logs')
    .select(`
      *,
      subjects (subject_code, subject_name)
    `)
    .eq('user_id', user.id)
    .gte('log_date', startDate)
    .lte('log_date', endDate)

  if (error) throw new Error(error.message)
  return logs
}

// Helper to fetch complete semester data for stats calculation on Dashboard
export async function getSemesterData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [profileRes, subjectsRes, slotsRes, holidaysRes, logsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('subjects').select('*').eq('user_id', user.id),
    supabase.from('timetable_slots').select('*').eq('user_id', user.id),
    supabase.from('holidays').select('*').eq('user_id', user.id),
    supabase.from('attendance_logs').select('*').eq('user_id', user.id),
  ])

  let holidaysData = holidaysRes.data || [];
  if (holidaysRes.error && holidaysRes.error.message?.includes('does not exist')) {
    const oldRes = await supabase.from('academic_holidays').select('*').eq('user_id', user.id);
    holidaysData = oldRes.data ? oldRes.data.map((h: any) => ({ ...h, holiday_name: h.description })) : [];
  }

  // If profile doesn't exist yet, or if there are no subjects/slots in the cloud DB, return null so frontend cleanly falls back to Demo Store
  if (!profileRes.data || ((!subjectsRes.data || subjectsRes.data.length === 0) && (!slotsRes.data || slotsRes.data.length === 0))) {
    return null;
  }

  return {
    profile: profileRes.data,
    subjects: subjectsRes.data || [],
    slots: slotsRes.data || [],
    holidays: holidaysData,
    logs: logsRes.data || [],
  }
}
