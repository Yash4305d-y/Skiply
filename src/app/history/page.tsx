'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import HistoryView from '@/components/history/history-view';
import { 
  getDemoSubjects, getDemoTimetableSlots, getDemoAttendanceLogs, 
  getDemoHolidays, getDemoProfile,
  saveDemoAttendanceLog, removeDemoAttendanceLog 
} from '@/lib/demo-store';
import { Subject, TimetableSlot, AttendanceLog, AttendanceStatus, AcademicHoliday, Profile } from '@/types';
import { Sparkles } from 'lucide-react';

export default function HistoryPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [holidays, setHolidays] = useState<AcademicHoliday[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setSubjects(getDemoSubjects());
    setSlots(getDemoTimetableSlots());
    setLogs(getDemoAttendanceLogs());
    setHolidays(getDemoHolidays());
    setProfile(getDemoProfile());
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="animate-pulse flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400 animate-spin" />
          <span>Loading Attendance Audit Logs...</span>
        </div>
      </div>
    );
  }

  const handleUpdateLog = (logId: string, newStatus: AttendanceStatus) => {
    const existingLog = logs.find(l => l.id === logId);
    if (!existingLog) return;

    const updatedLog: AttendanceLog = { ...existingLog, status: newStatus };
    const updatedList = saveDemoAttendanceLog(updatedLog);
    setLogs([...updatedList]);
  };

  const handleDeleteLog = (slotId: string, dateStr: string) => {
    const updatedList = removeDemoAttendanceLog(slotId, dateStr);
    setLogs([...updatedList]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

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
