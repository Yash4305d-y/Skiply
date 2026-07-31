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
  saveDemoAttendanceLog, removeDemoAttendanceLog 
} from '@/lib/demo-store';
import { Subject, TimetableSlot, AttendanceLog, AttendanceStatus, AcademicHoliday, Profile } from '@/types';
import { Sparkles } from 'lucide-react';
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
        console.log('Cloud getSemesterData fallback to Demo Store:', e);
      }

      setSubjects(getDemoSubjects());
      setSlots(getDemoTimetableSlots());
      setLogs(getDemoAttendanceLogs());
      setHolidays(getDemoHolidays());
      setProfile(getDemoProfile());
      setIsLoaded(true);
      setIsDemoMode(true);
    }
    initData();
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="animate-pulse flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-teal-400 animate-spin" />
          <span>Loading Attendance Audit Logs...</span>
        </div>
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
        setOfflineToast('📴 Offline — attendance queued to sync!');
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
          setOfflineToast('📴 Offline — attendance queued to sync!');
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

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
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
