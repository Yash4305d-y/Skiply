'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import dynamic from 'next/dynamic';
const HistoryView = dynamic(() => import('@/features/history/components/history-view'), {
  ssr: false,
  loading: () => <div className="animate-pulse h-96 bg-slate-900 rounded-2xl border border-slate-800" />
});
import { 
  getDemoSubjects, getDemoTimetableSlots, getDemoAttendanceLogs, 
  getDemoHolidays, getDemoProfile,
  saveDemoAttendanceLog, removeDemoAttendanceLog,
  isDemoModeActive, resetDemoData, seedDemoData
} from '@/lib/demo-store';
import { Subject, TimetableSlot, AttendanceLog, AttendanceStatus, AcademicHoliday, Profile } from '@/types';
import { LoaderCircle, ArrowRight } from 'lucide-react';
import NextLink from 'next/link';
import { markAttendance, getSemesterData, removeAttendance } from '@/actions/db';
import { queueAttendanceAction } from '@/lib/utils/offlineQueue';

export default function HistoryPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [holidays, setHolidays] = useState<AcademicHoliday[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
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
          setIsDemoMode(false);
          return;
        }
      } catch (e) {
        console.log('Cloud getSemesterData error:', e);
      }

      const isUrlDemo = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === 'true';
      if (isDemoModeActive() || isUrlDemo) {
        const dProf = getDemoProfile();
        const dSubs = getDemoSubjects();
        const dSlots = getDemoTimetableSlots();
        const dHols = getDemoHolidays();
        const dLogs = getDemoAttendanceLogs();
        setProfile(dProf);
        setSubjects(dSubs);
        setSlots(dSlots);
        setHolidays(dHols);
        setLogs(dLogs);
        setIsLoaded(true);
        setIsDemoMode(true);
        return;
      }

      setProfile({ id: 'new', target_attendance_percentage: 75 } as any);
      setSubjects([]);
      setSlots([]);
      setHolidays([]);
      setLogs([]);
      setIsLoaded(true);
      setIsDemoMode(false);
    }
    initData();

    const handleDemoState = () => initData();
    window.addEventListener('skiply_demo_state_changed', handleDemoState);
    return () => window.removeEventListener('skiply_demo_state_changed', handleDemoState);
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen min-h-dvh bg-[#0B0C0E] flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-2">
          <LoaderCircle strokeWidth={1.65} className="w-5 h-5 text-slate-400 animate-spin" />
          <span className="text-sm">Loading attendance audit logs...</span>
        </div>
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="min-h-screen min-h-dvh flex flex-col bg-[#0B0C0E] text-slate-100">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full glass-card border border-white/5 bg-slate-900/60 rounded-2xl p-6 sm:p-8 space-y-4">
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
    if (isDemoMode) {
      const updatedList = saveDemoAttendanceLog(updatedLog);
      setLogs([...updatedList]);
    } else {
      setLogs(prev => prev.map(l => l.id === logId ? updatedLog : l));
    }

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
    if (isDemoMode) {
      const updatedList = removeDemoAttendanceLog(slotId, dateStr);
      setLogs([...updatedList]);
    } else {
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
        {isDemoMode && (
          <div className="mb-6 p-3 sm:px-4 rounded-xl bg-slate-900/60 border border-teal-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
              <span><strong>Demo mode active:</strong> Testing visual attendance calendar, 3-dot telemetry, and audit table. All changes persist in your browser.</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  resetDemoData();
                  window.location.reload();
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Reset demo data
              </button>
            </div>
          </div>
        )}

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
