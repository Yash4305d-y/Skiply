'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import HeroWidget from '@/features/dashboard/components/hero-widget';
import DailyClassList from '@/features/dashboard/components/daily-class-list';
import AttendanceReminder from '@/features/dashboard/components/attendance-reminder';
import { getSemesterData, markAttendance, removeAttendance, updateSemesterConfig } from '@/actions/db';
import { queueAttendanceAction } from '@/lib/utils/offlineQueue';
import { calculateOverallSemesterStats } from '@/lib/math-engine';
import { 
  Profile, Subject, TimetableSlot, AcademicHoliday, 
  AttendanceLog, AttendanceStatus, DailyClassItem 
} from '@/types';
import NextLink from 'next/link';
import { ArrowRight } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';

function getInitialSemesterData() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('skiply_semester_data_cache') || sessionStorage.getItem('skiply_semester_data_cache');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.profile) return parsed;
    }
  } catch (_) {}
  return null;
}

export default function DashboardPage() {
  const cachedData = useMemo(() => getInitialSemesterData(), []);
  const [profile, setProfile] = useState<Profile | null>(() => cachedData?.profile || null);
  const [subjects, setSubjects] = useState<Subject[]>(() => cachedData?.subjects || []);
  const [slots, setSlots] = useState<TimetableSlot[]>(() => cachedData?.slots || []);
  const [holidays, setHolidays] = useState<AcademicHoliday[]>(() => cachedData?.holidays || []);
  const [logs, setLogs] = useState<AttendanceLog[]>(() => cachedData?.logs || []);
  const [isLoaded, setIsLoaded] = useState<boolean>(() => Boolean(cachedData?.profile));

  // Selected Date State (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  // Derive holiday status locally from semester holidays (instant, 0ms latency)
  const localHoliday = useMemo(() => {
    return holidays.find(h => h.holiday_date === selectedDate);
  }, [holidays, selectedDate]);
  const dailyHoliday = Boolean(localHoliday);
  const dailyHolidayName = localHoliday ? ((localHoliday as any).holiday_name || localHoliday.description) : null;

  const [offlineToast, setOfflineToast] = useState<string | null>(null);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  useEffect(() => {
    const handleSynced = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.synced > 0) {
        setSyncToast('Offline attendance synced to database');
        setTimeout(() => setSyncToast(null), 4000);
      }
    };
    window.addEventListener('skiply_offline_synced', handleSynced);
    return () => window.removeEventListener('skiply_offline_synced', handleSynced);
  }, []);

  useEffect(() => {
    async function initData() {
      try {
        const cloudData = await getSemesterData();
        if (cloudData && cloudData.profile) {
          setProfile(cloudData.profile);
          setSubjects(cloudData.subjects);
          setSlots(cloudData.slots);
          setHolidays(cloudData.holidays);
          setLogs(cloudData.logs);
          setIsLoaded(true);
          try {
            const str = JSON.stringify(cloudData);
            localStorage.setItem('skiply_semester_data_cache', str);
            sessionStorage.setItem('skiply_semester_data_cache', str);
          } catch (_) {}
          return;
        }
      } catch (e) {
        console.log('Cloud getSemesterData error:', e);
      }

      if (!cachedData?.profile) {
        setProfile({ id: 'new', target_attendance_percentage: 75 } as any);
        setSubjects([]);
        setSlots([]);
        setHolidays([]);
        setLogs([]);
        setIsLoaded(true);
      }
    }

    initData();
  }, [cachedData]);

  // Debounced save to backend for target percentage updates
  useEffect(() => {
    if (!profile || !isLoaded || profile.id === 'new') return;
    
    const handler = setTimeout(async () => {
      try {
        const res = await updateSemesterConfig(profile.target_attendance_percentage, profile.semester_start_date, profile.semester_end_date);
        if (res?.error) {
          console.log('Semester config save notice:', res.error);
        }
      } catch (e) {
        console.error('Failed to save target:', e);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [profile, profile?.target_attendance_percentage, isLoaded]);

  // Calculate live deterministic math stats across semester using useMemo
  const { overall, subjectStats } = useMemo(() => calculateOverallSemesterStats(
    subjects,
    slots,
    holidays,
    logs,
    profile?.target_attendance_percentage ?? 75,
    profile?.semester_end_date,
    profile?.semester_start_date
  ), [subjects, slots, holidays, logs, profile?.target_attendance_percentage, profile?.semester_end_date, profile?.semester_start_date]);

  if (!isLoaded || !profile) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0B0C0E] text-slate-100">
        <Navbar />
        <main 
          className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-28 sm:pb-32 md:py-8 w-full"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column Skeleton (Hero Metrics Mirror) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[#121417] border border-white/[0.06] rounded-xl p-5 space-y-4 animate-pulse">
                {/* Top row: Status badge + Target */}
                <div className="flex items-center justify-between">
                  <div className="h-6 w-32 bg-white/[0.08] rounded-lg" />
                  <div className="h-4 w-20 bg-white/[0.04] rounded" />
                </div>

                {/* Main Metric */}
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div className="h-10 w-24 bg-white/[0.08] rounded-md" />
                    <div className="h-4 w-28 bg-white/[0.04] rounded" />
                  </div>
                  {/* Progress bar line */}
                  <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-white/[0.08] rounded-full" />
                  </div>
                </div>

                {/* Hero message & subtext */}
                <div className="pt-3 border-t border-white/[0.06] space-y-2">
                  <div className="h-4 w-44 bg-white/[0.08] rounded" />
                  <div className="h-3 w-56 bg-white/[0.04] rounded" />
                </div>

                {/* 4 Stat Figures Grid */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/[0.06]">
                  <div className="p-2.5 rounded-lg bg-[#181B1F] space-y-2">
                    <div className="h-3 w-12 bg-white/[0.06] rounded" />
                    <div className="h-6 w-10 bg-white/[0.08] rounded" />
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#181B1F] space-y-2">
                    <div className="h-3 w-12 bg-white/[0.06] rounded" />
                    <div className="h-6 w-10 bg-white/[0.08] rounded" />
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#181B1F] space-y-2">
                    <div className="h-3 w-16 bg-teal-500/15 rounded" />
                    <div className="h-6 w-10 bg-teal-500/25 rounded" />
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#181B1F] space-y-2">
                    <div className="h-3 w-14 bg-white/[0.06] rounded" />
                    <div className="h-6 w-10 bg-white/[0.08] rounded" />
                  </div>
                </div>

                {/* Target slider placeholder */}
                <div className="pt-3 border-t border-white/[0.06] space-y-2">
                  <div className="flex justify-between">
                    <div className="h-3 w-28 bg-white/[0.06] rounded" />
                    <div className="h-3 w-10 bg-white/[0.06] rounded" />
                  </div>
                  <div className="h-2 w-full bg-white/[0.04] rounded-full" />
                </div>
              </div>
            </div>

            {/* Right Column Skeleton (Daily Schedule Mirror) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Heading */}
              <div className="space-y-1.5 animate-pulse">
                <div className="h-7 w-36 bg-white/[0.08] rounded-md" />
                <div className="h-3 w-56 bg-white/[0.04] rounded" />
              </div>

              {/* Date Header Skeleton */}
              <div className="flex items-center justify-between pt-2 animate-pulse">
                <div className="h-5 w-40 bg-white/[0.08] rounded" />
                <div className="h-8 w-32 bg-[#121417] border border-white/[0.06] rounded-lg" />
              </div>

              {/* Class Cards Skeleton */}
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-[#121417] rounded-xl animate-pulse border border-white/[0.06] p-4 flex items-center justify-between">
                    <div className="space-y-2.5">
                      <div className="h-4 w-32 bg-white/[0.08] rounded" />
                      <div className="h-3 w-48 bg-white/[0.04] rounded" />
                      <div className="h-3 w-24 bg-white/[0.04] rounded" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 w-16 bg-white/[0.06] rounded-lg" />
                      <div className="h-8 w-16 bg-white/[0.06] rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0B0C0E] text-slate-100">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center pb-28 sm:pb-32 md:py-8">
          <div className="max-w-md w-full bg-[#121417] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-4 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              No timetable configured
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Upload your timetable or syllabus in onboarding to calculate safe skips and track attendance.
            </p>
            <div className="pt-2">
              <NextLink 
                href="/onboarding" 
                className="btn-interactive inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 px-5 py-2.5 rounded-xl font-semibold text-sm"
              >
                <span>Set up timetable</span>
                <ArrowRight strokeWidth={1.75} className="w-4 h-4" />
              </NextLink>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Handle instant target updates from Hero slider
  const handleUpdateTarget = (newTarget: number) => {
    if (!profile) return;
    
    // Instant local state update for instant recalculation
    setProfile({ ...profile, target_attendance_percentage: newTarget });
  };




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
        total_available: 0,
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
  const handleMarkAttendance = async (
    slotId: string, 
    subjectId: string, 
    status: AttendanceStatus, 
    swappedSubjectId?: string
  ) => {
    if (!profile) return;

    const previousLogs = logs;
    const newLog: AttendanceLog = {
      id: `log-${selectedDate}-${slotId}`,
      user_id: profile.id,
      subject_id: subjectId,
      timetable_slot_id: slotId,
      log_date: selectedDate,
      status,
      swapped_subject_id: swappedSubjectId
    };

    // 1. INSTANT OPTIMISTIC UI UPDATE
    setLogs(prev => {
      const existingIdx = prev.findIndex(
        l => l.subject_id === subjectId && l.timetable_slot_id === slotId && l.log_date === selectedDate
      );
      if (existingIdx >= 0) {
        const newArr = [...prev];
        newArr[existingIdx] = newLog;
        return newArr;
      }
      return [...prev, newLog];
    });

    // Check if browser is offline
    if (typeof window !== 'undefined' && !navigator.onLine && (status === 'PRESENT' || status === 'ABSENT' || status === 'CANCELLED')) {
      queueAttendanceAction({
        subjectId,
        timetableSlotId: slotId,
        logDate: selectedDate,
        status,
      });
      setOfflineToast('Offline — attendance queued to sync');
      setTimeout(() => setOfflineToast(null), 3500);
      return;
    }

    // 2. BACKGROUND SERVER ACTION WITH ROLLBACK
    if (status === 'PRESENT' || status === 'ABSENT' || status === 'CANCELLED') {
      try {
        const res = await markAttendance({
          subjectId,
          timetableSlotId: slotId,
          logDate: selectedDate,
          status,
        });
        if (res && (res as any).error) {
          throw new Error((res as any).error);
        }
      } catch (e) {
        // If fetch failed due to network / offline error, queue it!
        if (e instanceof Error && (e.message.includes('fetch') || e.message.includes('network') || e.message.includes('Failed to fetch') || !navigator.onLine)) {
          queueAttendanceAction({
            subjectId,
            timetableSlotId: slotId,
            logDate: selectedDate,
            status,
          });
          setOfflineToast('Offline — attendance queued to sync');
          setTimeout(() => setOfflineToast(null), 3500);
        } else {
          console.log('Background markAttendance error:', e);
          // Rollback optimistic update
          setLogs(previousLogs);
          setOfflineToast('Failed to save attendance — changes reverted');
          setTimeout(() => setOfflineToast(null), 3500);
        }
      }
    }
  };

  const handleUndoAttendance = async (slotId: string) => {
    const slot = slots.find(s => s.id === slotId);
    if (!slot) return;
    setLogs(prev => prev.filter(l => !(l.timetable_slot_id === slotId && l.log_date === selectedDate)));
    try {
      await removeAttendance({
        subjectId: slot.subject_id,
        timetableSlotId: slotId,
        logDate: selectedDate
      });
    } catch (e) {
      console.log('Undo failed offline:', e);
    }
  };

  return (
    <div className="min-h-screen min-h-dvh flex flex-col bg-[#0B0C0E] text-slate-100">
      <Navbar />

      {/* Floating Offline & Sync Toast Banners */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
        {offlineToast && (
          <div className="px-3.5 py-1.5 rounded-lg bg-[#181B1F] text-amber-400 font-medium text-xs flex items-center gap-2 border border-amber-500/20 shadow-md">
            <span>{offlineToast}</span>
          </div>
        )}
        {syncToast && (
          <div className="px-3.5 py-1.5 rounded-lg bg-[#181B1F] text-teal-400 font-medium text-xs flex items-center gap-2 border border-teal-500/20 shadow-md">
            <span>{syncToast}</span>
          </div>
        )}
      </div>

      <main 
        className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-28 sm:pb-32 md:py-8 w-full"
      >

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: HERO STATS & GOALS */}
          <div className="lg:col-span-4 space-y-6">
            <HeroWidget stats={overall} onUpdateTarget={handleUpdateTarget} />
          </div>

          {/* RIGHT COLUMN: DAILY SCHEDULE & FEED */}
          <div className="lg:col-span-8 space-y-4">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl text-white tracking-[-0.02em] [text-wrap:balance]">
                Daily schedule
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Single-tap to mark present, absent, or cancelled
              </p>
            </div>

            <DailyClassList
              items={dailyItems}
              allSubjects={subjects}
              holidays={holidays}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onMarkAttendance={handleMarkAttendance}
              onUndoAttendance={handleUndoAttendance}
              isOutOfSemesterBounds={profile ? (selectedDate < profile.semester_start_date || selectedDate > profile.semester_end_date) : false}
              cloudHolidayName={dailyHoliday ? dailyHolidayName : null}
              semesterStartDate={profile?.semester_start_date}
              semesterEndDate={profile?.semester_end_date}
            />
          </div>
        </div>
        
        <AttendanceReminder slots={slots} logs={logs} />
      </main>

      <Footer />
    </div>
  );
}
