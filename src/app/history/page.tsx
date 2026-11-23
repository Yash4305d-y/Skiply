'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import HistoryView from '@/features/history/components/history-view';
import { Subject, TimetableSlot, AttendanceLog, AttendanceStatus, AcademicHoliday, Profile } from '@/types';
import { ArrowRight } from 'lucide-react';
import NextLink from 'next/link';
import { markAttendance, getSemesterData, removeAttendance } from '@/actions/db';
import { queueAttendanceAction } from '@/lib/utils/offlineQueue';

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

export default function HistoryPage() {
  const cachedData = useMemo(() => getInitialSemesterData(), []);
  const [profile, setProfile] = useState<Profile | null>(() => cachedData?.profile || null);
  const [subjects, setSubjects] = useState<Subject[]>(() => cachedData?.subjects || []);
  const [slots, setSlots] = useState<TimetableSlot[]>(() => cachedData?.slots || []);
  const [logs, setLogs] = useState<AttendanceLog[]>(() => cachedData?.logs || []);
  const [holidays, setHolidays] = useState<AcademicHoliday[]>(() => cachedData?.holidays || []);
  const [isLoaded, setIsLoaded] = useState<boolean>(() => Boolean(cachedData?.profile));
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

  if (!isLoaded) {
    return (
      <div className="min-h-screen min-h-dvh flex flex-col bg-[#0B0C0E] text-slate-100">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 sm:pb-32 md:py-8 w-full">
          <div className="space-y-6 animate-pulse">
            {/* Title Skeleton */}
            <div className="space-y-2">
              <div className="h-8 w-64 bg-white/[0.08] rounded-md" />
              <div className="h-3.5 w-80 bg-white/[0.04] rounded" />
            </div>

            {/* Subject Summary Cards Row */}
            <div className="flex gap-3 overflow-x-hidden pt-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="min-w-[160px] p-3 rounded-xl bg-[#121417] border border-white/[0.06] space-y-2">
                  <div className="h-3 w-16 bg-white/[0.08] rounded" />
                  <div className="h-5 w-24 bg-white/[0.06] rounded" />
                </div>
              ))}
            </div>

            {/* Filter toolbar skeleton */}
            <div className="h-12 bg-[#121417] rounded-xl border border-white/[0.06] flex items-center justify-between px-4">
              <div className="h-4 w-32 bg-white/[0.06] rounded" />
              <div className="h-7 w-28 bg-white/[0.04] rounded-lg" />
            </div>

            {/* Calendar Grid Skeleton */}
            <div className="bg-[#121417] border border-white/[0.06] rounded-xl p-4 space-y-4">
              <div className="flex justify-between items-center pb-2">
                <div className="h-5 w-32 bg-white/[0.08] rounded" />
                <div className="h-7 w-20 bg-white/[0.04] rounded-lg" />
              </div>
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-lg bg-white/[0.02] border border-white/[0.03]" />
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="min-h-screen min-h-dvh flex flex-col bg-[#0B0C0E] text-slate-100">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center pb-28 sm:pb-32 md:py-8">
          <div className="max-w-md w-full bg-[#121417] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-4 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              No timetable configured
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Upload your timetable or syllabus in onboarding to view attendance audit records.
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

  const handleUpdateLog = async (logId: string, newStatus: AttendanceStatus) => {
    const existingLog = logs.find(l => l.id === logId);
    if (!existingLog) return;

    const updatedLog: AttendanceLog = { ...existingLog, status: newStatus };
    setLogs(prev => prev.map(l => l.id === logId ? updatedLog : l));

    if (newStatus === 'PRESENT' || newStatus === 'ABSENT' || newStatus === 'CANCELLED') {
      // Check if browser is offline
      if (typeof window !== 'undefined' && !navigator.onLine) {
        queueAttendanceAction({
          subjectId: existingLog.subject_id,
          timetableSlotId: existingLog.timetable_slot_id || null,
          logDate: existingLog.log_date,
          status: newStatus,
        });
        setOfflineToast('Offline — attendance queued to sync');
        setTimeout(() => setOfflineToast(null), 3500);
        return;
      }

      // Background server action
      try {
        await markAttendance({
          subjectId: existingLog.subject_id,
          timetableSlotId: existingLog.timetable_slot_id || null,
          logDate: existingLog.log_date,
          status: newStatus,
        });
      } catch (e) {
        if (e instanceof Error && (e.message.includes('fetch') || e.message.includes('network') || e.message.includes('Failed to fetch') || !navigator.onLine)) {
          queueAttendanceAction({
            subjectId: existingLog.subject_id,
            timetableSlotId: existingLog.timetable_slot_id || null,
            logDate: existingLog.log_date,
            status: newStatus,
          });
          setOfflineToast('Offline — attendance queued to sync');
          setTimeout(() => setOfflineToast(null), 3500);
        } else {
          console.log('Background markAttendance skipped/failed:', e);
        }
      }
    }
  };

  const handleDeleteLog = async (slotId: string, dateStr: string) => {
    const logToRemove = logs.find(l => l.timetable_slot_id === slotId && l.log_date === dateStr);
    if (!logToRemove) return;
    setLogs(prev => prev.filter(l => !(l.timetable_slot_id === slotId && l.log_date === dateStr)));
    try {
      await removeAttendance({
        subjectId: logToRemove.subject_id,
        timetableSlotId: slotId,
        logDate: dateStr
      });
    } catch (e) {
      console.log('Delete log failed:', e);
    }
  };

  return (
    <div className="min-h-screen min-h-dvh flex flex-col bg-[#0B0C0E] text-slate-100">
      <Navbar />

      {/* Floating Offline & Sync Toast Banners */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
        {offlineToast && (
          <div className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 font-medium text-xs shadow-lg flex items-center gap-2 border border-amber-500/20 backdrop-blur-md">
            <span>{offlineToast}</span>
          </div>
        )}
        {syncToast && (
          <div className="px-4 py-2 rounded-xl bg-teal-500/10 text-teal-400 font-medium text-xs shadow-lg flex items-center gap-2 border border-teal-500/20 backdrop-blur-md">
            <span>{syncToast}</span>
          </div>
        )}
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-28 sm:pb-32 md:py-8 w-full">

        <HistoryView
          logs={logs}
          subjects={subjects}
          slots={slots}
          holidays={holidays}
          endDateStr={profile?.semester_end_date}
          profile={profile}
          onUpdateLog={handleUpdateLog}
          onDeleteLog={handleDeleteLog}
        />
      </main>

      <Footer />
    </div>
  );
}
