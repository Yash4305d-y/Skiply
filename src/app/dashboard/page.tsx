'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import HeroWidget from '@/components/dashboard/hero-widget';
import DailyClassList from '@/components/dashboard/daily-class-list';
import { 
  getDemoProfile, getDemoSubjects, getDemoTimetableSlots, 
  getDemoHolidays, getDemoAttendanceLogs, saveDemoAttendanceLog, 
  removeDemoAttendanceLog, isOnboardedInDemo 
} from '@/lib/demo-store';
import { calculateOverallSemesterStats } from '@/lib/math-engine';
import { 
  Profile, Subject, TimetableSlot, AcademicHoliday, 
  AttendanceLog, AttendanceStatus, DailyClassItem 
} from '@/types';
import NextLink from 'next/link';
import { Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [holidays, setHolidays] = useState<AcademicHoliday[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Selected Date State (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    // Initialize date to today in local YYYY-MM-DD format
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);

    // Load store data
    setProfile(getDemoProfile());
    setSubjects(getDemoSubjects());
    setSlots(getDemoTimetableSlots());
    setHolidays(getDemoHolidays());
    setLogs(getDemoAttendanceLogs());
    setIsLoaded(true);
  }, []);

  if (!isLoaded || !profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="animate-pulse flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400 animate-spin" />
          <span>Loading Skiply Attendance Engine...</span>
        </div>
      </div>
    );
  }

  // Calculate live deterministic math stats across semester
  const { overall, subjectStats } = calculateOverallSemesterStats(
    subjects,
    slots,
    holidays,
    logs,
    profile.target_attendance_percentage,
    profile.semester_end_date,
    profile.semester_start_date
  );

  // Derive DailyClassItems for selectedDate
  const [sy, sm, sd] = selectedDate.split('-').map(Number);
  const selectedDateObj = new Date(sy, sm - 1, sd);
  const dayOfWeek = selectedDateObj.getDay(); // 0=Sun, ..., 6=Sat

  const dailyItems: DailyClassItem[] = slots
    .filter(sl => sl.day_of_week === dayOfWeek)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
    .map(sl => {
      const sub = subjects.find(s => s.id === sl.subject_id) || {
        id: sl.subject_id,
        user_id: profile.id,
        subject_code: 'UNKNOWN',
        subject_name: 'Unknown Subject',
        is_lab: false,
        credit_hours: 3,
        color_hex: '#6366f1'
      };

      // Check if log exists for this slot on selectedDate
      const currentLog = logs.find(
        l => l.timetable_slot_id === sl.id && l.log_date === selectedDate
      ) || null;

      const stats = subjectStats.find(st => st.subject_id === sub.id) || {
        subject_id: sub.id,
        subject_code: sub.subject_code,
        subject_name: sub.subject_name,
        is_lab: sub.is_lab,
        color_hex: sub.color_hex,
        present: 0,
        absent: 0,
        cancelled: 0,
        swapped: 0,
        conducted: 0,
        remaining: 0,
        total_expected: 0,
        current_percentage: 100,
        safe_skips: 0,
        classes_to_attend: 0,
        status: 'SAFE',
        message: ''
      };

      return {
        slot_id: sl.id,
        subject_id: sub.id,
        subject_code: sub.subject_code,
        subject_name: sub.subject_name,
        is_lab: sub.is_lab,
        color_hex: sub.color_hex,
        start_time: sl.start_time,
        end_time: sl.end_time,
        room_number: sl.room_number,
        current_log: currentLog,
        stats
      };
    });

  // Action Handlers
  const handleMarkAttendance = (
    slotId: string, 
    subjectId: string, 
    status: AttendanceStatus, 
    swappedSubjectId?: string
  ) => {
    const newLog: AttendanceLog = {
      id: `log-${selectedDate}-${slotId}`,
      user_id: profile.id,
      subject_id: subjectId,
      timetable_slot_id: slotId,
      log_date: selectedDate,
      status,
      swapped_subject_id: swappedSubjectId
    };

    const updatedLogs = saveDemoAttendanceLog(newLog);
    setLogs([...updatedLogs]);
  };

  const handleUndoAttendance = (slotId: string) => {
    const updatedLogs = removeDemoAttendanceLog(slotId, selectedDate);
    setLogs([...updatedLogs]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Onboarding Banner if not onboarded yet */}
        {!isOnboardedInDemo() && (
          <div className="glass-card p-5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border-indigo-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">You are currently using sample demo data!</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Want to track your own university schedule? Use our Vision AI wizard to upload your timetable and calendar in seconds.
                </p>
              </div>
            </div>

            <NextLink
              href="/onboarding"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/25 whitespace-nowrap transition-all"
            >
              <span>⚡ Start AI Setup</span>
              <ArrowRight className="w-4 h-4" />
            </NextLink>
          </div>
        )}

        {/* HERO CARD: SAFE SKIPS SUMMARY & MATH ENGINE */}
        <HeroWidget stats={overall} />

        {/* DAILY SCHEDULE & SINGLE-TAP ACTION CARDS */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Daily Class Schedule
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              Single-tap Present / Absent / Cancelled
            </span>
          </div>

          <DailyClassList
            items={dailyItems}
            allSubjects={subjects}
            holidays={holidays}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onMarkAttendance={handleMarkAttendance}
            onUndoAttendance={handleUndoAttendance}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
