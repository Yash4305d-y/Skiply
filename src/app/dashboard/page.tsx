'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';

const HeroWidget = dynamic(() => import('@/features/dashboard/components/hero-widget'), { ssr: false });
const DailyClassList = dynamic(() => import('@/features/dashboard/components/daily-class-list'), { ssr: false });
const AttendanceReminder = dynamic(() => import('@/features/dashboard/components/attendance-reminder'), { ssr: false });
import { 
  getDemoProfile, getDemoSubjects, getDemoTimetableSlots, 
  getDemoHolidays, getDemoAttendanceLogs, saveDemoAttendanceLog, 
  removeDemoAttendanceLog, isOnboardedInDemo 
} from '@/lib/demo-store';
import { getSemesterData, getDailySchedule, markAttendance } from '@/actions/db';
import { queueAttendanceAction } from '@/lib/utils/offlineQueue';
import { calculateOverallSemesterStats } from '@/lib/math-engine';
import { 
  Profile, Subject, TimetableSlot, AcademicHoliday, 
  AttendanceLog, AttendanceStatus, DailyClassItem 
} from '@/types';
import NextLink from 'next/link';
import Image from 'next/image';
import { Sparkles, ArrowRight, Calendar as CalendarIcon, Check, Settings, LogOut, Loader2, Link2, Database, Shield } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { updateSemesterConfig } from '@/actions/db';
import { updateDemoSemesterConfig } from '@/lib/demo-store';

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [holidays, setHolidays] = useState<AcademicHoliday[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Selected Date State (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [dailyHoliday, setDailyHoliday] = useState<boolean>(false);
  const [dailyHolidayName, setDailyHolidayName] = useState<string | null>(null);
  const [offlineToast, setOfflineToast] = useState<string | null>(null);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  useEffect(() => {
    const handleSynced = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.synced > 0) {
        setSyncToast('🔄 Offline attendance synced to database!');
        setTimeout(() => setSyncToast(null), 4000);
      }
    };
    window.addEventListener('skiply_offline_synced', handleSynced);
    return () => window.removeEventListener('skiply_offline_synced', handleSynced);
  }, []);

  useEffect(() => {
    async function initData() {
      try {
        // Try fetching live Supabase data from Server Action
        const cloudData = await getSemesterData();
        if (cloudData && cloudData.profile) {
          setProfile(cloudData.profile);
          setSubjects(cloudData.subjects);
          setSlots(cloudData.slots);
          setHolidays(cloudData.holidays);
          setLogs(cloudData.logs);
          setIsLoaded(true);
          setIsDemoMode(false);
          return;
        }
      } catch (e) {
        console.log('Cloud getSemesterData error:', e);
      }

      // If no data exists, set empty state instead of demo mode
      setProfile({ id: 'new', target_attendance_percentage: 75 } as any);
      setSubjects([]);
      setSlots([]);
      setHolidays([]);
      setLogs([]);
      setIsLoaded(true);
      setIsDemoMode(false);
    }

    initData();
  }, []);

  // Effect to query getDailySchedule whenever selectedDate changes
  useEffect(() => {
    if (!selectedDate || !isLoaded) return;
    const [sy, sm, sd] = selectedDate.split('-').map(Number);
    const selectedDateObj = new Date(sy, sm - 1, sd);
    const dayOfWeek = selectedDateObj.getDay();

    async function checkDailySchedule() {
      if (!isDemoMode) {
        try {
          const res = await getDailySchedule(dayOfWeek, selectedDate);
          if (res) {
            setDailyHoliday(res.isHoliday);
            setDailyHolidayName(res.holidayName);
            return;
          }
        } catch (e) {
          console.log('getDailySchedule error:', e);
        }
      }

      // Fallback local holiday check
      const localHol = holidays.find(h => h.holiday_date === selectedDate);
      setDailyHoliday(Boolean(localHol));
      setDailyHolidayName(localHol ? localHol.description : null);
    }

    checkDailySchedule();
  }, [selectedDate, holidays, isLoaded, isDemoMode]);

  // Debounced save to backend for target percentage updates
  useEffect(() => {
    if (!profile || !isLoaded) return;
    
    const handler = setTimeout(async () => {
      if (isDemoMode) {
        updateDemoSemesterConfig(profile.target_attendance_percentage, profile.semester_start_date, profile.semester_end_date);
      } else {
        try {
          await updateSemesterConfig(profile.target_attendance_percentage, profile.semester_start_date, profile.semester_end_date);
        } catch (e) {
          console.error('Failed to save target:', e);
        }
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [profile, profile?.target_attendance_percentage, isLoaded, isDemoMode]);

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
      <div className="min-h-screen flex flex-col bg-slate-950">
        <Navbar />
        <m.main 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 0.5 }}
          className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column Skeleton */}
            <div className="lg:col-span-4 space-y-4">
              <div className="h-64 bg-slate-900/50 rounded-2xl animate-pulse border border-white/5" />
              <div className="h-32 bg-slate-900/50 rounded-2xl animate-pulse border border-white/5" />
            </div>
            {/* Right Column Skeleton */}
            <div className="lg:col-span-8 space-y-4">
              <div className="h-16 bg-slate-900/50 rounded-2xl animate-pulse border border-white/5" />
              <div className="space-y-2">
                <div className="h-20 bg-slate-900/50 rounded-xl animate-pulse border border-white/5" />
                <div className="h-20 bg-slate-900/50 rounded-xl animate-pulse border border-white/5" />
                <div className="h-20 bg-slate-900/50 rounded-xl animate-pulse border border-white/5" />
              </div>
            </div>
          </div>
      </m.main>
    </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <Image src="/nav-logo.png" alt="Skiply Logo" width={64} height={64} className="mx-auto mb-6 object-contain rounded-2xl shadow-lg" />
            <h2 className="text-2xl font-bold text-white mb-4">Welcome to Skiply!</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Please upload your timetable and holiday list in the AI Onboarding tab to get started.
            </p>
            <NextLink 
              href="/onboarding" 
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95"
            >
              Go to AI Onboarding <ArrowRight className="w-4 h-4" />
            </NextLink>
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
    if (isDemoMode) {
      const updatedLogs = saveDemoAttendanceLog(newLog);
      setLogs([...updatedLogs]);
    } else {
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
    }

    // Check if browser is offline
    if (typeof window !== 'undefined' && !navigator.onLine && (status === 'PRESENT' || status === 'ABSENT' || status === 'CANCELLED')) {
      queueAttendanceAction({
        subjectId,
        timetableSlotId: slotId,
        logDate: selectedDate,
        status,
      });
      setOfflineToast('📴 Offline — attendance queued to sync!');
      setTimeout(() => setOfflineToast(null), 3500);
      return;
    }

    // 2. QUIET BACKGROUND SERVER ACTION
    if (!isDemoMode && (status === 'PRESENT' || status === 'ABSENT' || status === 'CANCELLED')) {
      try {
        await markAttendance({
          subjectId,
          timetableSlotId: slotId,
          logDate: selectedDate,
          status,
        });
      } catch (e) {
        // If fetch failed due to network / offline error, queue it!
        if (e instanceof Error && (e.message.includes('fetch') || e.message.includes('network') || e.message.includes('Failed to fetch') || !navigator.onLine)) {
          queueAttendanceAction({
            subjectId,
            timetableSlotId: slotId,
            logDate: selectedDate,
            status,
          });
          setOfflineToast('📴 Offline — attendance queued to sync!');
          setTimeout(() => setOfflineToast(null), 3500);
        } else {
          console.log('Background markAttendance skipped or failed (Demo Mode or offline):', e);
        }
      }
    }
  };

  const handleUndoAttendance = async (slotId: string) => {
    if (isDemoMode) {
      const updatedLogs = removeDemoAttendanceLog(slotId, selectedDate);
      setLogs([...updatedLogs]);
    } else {
      const slot = slots.find(s => s.id === slotId);
      if (!slot) return;
      setLogs(prev => prev.filter(l => !(l.timetable_slot_id === slotId && l.log_date === selectedDate)));
      try {
        const { removeAttendance } = await import('@/actions/db');
        await removeAttendance({
          subjectId: slot.subject_id,
          timetableSlotId: slotId,
          logDate: selectedDate
        });
      } catch (e) {
        console.log('Undo failed offline:', e);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      {/* Floating Offline & Sync Toast Banners */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
        {offlineToast && (
          <div className="px-5 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 border border-amber-400 animate-bounce">
            <span>{offlineToast}</span>
          </div>
        )}
        {syncToast && (
          <div className="px-5 py-2.5 rounded-2xl bg-emerald-500 text-white font-bold text-xs shadow-2xl flex items-center gap-2 border border-emerald-400 animate-bounce">
            <span>{syncToast}</span>
          </div>
        )}
      </div>

      <m.main 
        className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.06 }
          }
        }}
      >

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: HERO STATS & GOALS */}
          <div className="lg:col-span-4 space-y-6">
            <HeroWidget stats={overall} onUpdateTarget={handleUpdateTarget} />
            

          </div>

          {/* RIGHT COLUMN: DAILY SCHEDULE & FEED */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl sm:text-[28px] md:text-[32px] font-bold text-white tracking-[-0.02em]">
                Daily Schedule
              </h2>
              <span className="text-[11px] text-slate-400 font-medium">
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
              isOutOfSemesterBounds={profile ? (selectedDate < profile.semester_start_date || selectedDate > profile.semester_end_date) : false}
              cloudHolidayName={dailyHoliday ? dailyHolidayName : null}
            />
          </div>
        </div>
        
        <AttendanceReminder slots={slots} logs={logs} />
      </m.main>

      <Footer />
    </div>
  );
}
