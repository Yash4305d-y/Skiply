'use client';

import React, { useState, useEffect, startTransition } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Check, X, Ban, 
  ArrowRightLeft, Grid, List, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { AttendanceLog, Subject, TimetableSlot, AttendanceStatus, AcademicHoliday, Profile } from '@/types';
import { calculateRemainingLectures, calculateSubjectStats, calculateConductedTillDate } from '@/lib/math-engine';
import { usePerformanceTier } from '@/lib/utils/use-performance-tier';
import { AnimatedNumber } from '@/components/ui/animated-number';

const TableAuditView = dynamic(() => import('./table-audit-view').then(m => m.TableAuditView), {
  ssr: false,
  loading: () => <div className="animate-pulse h-96 bg-[#121417] rounded-xl border border-white/[0.06]" />
});

// Memoized Calendar Cell with CSS layout/paint containment
const CalendarCell = React.memo(function CalendarCell({
  dayNum,
  dateStr,
  isOutOfSemester,
  isToday,
  dayLogs,
  onOpenModal
}: {
  dayNum: number;
  dateStr: string;
  isOutOfSemester: boolean;
  isToday: boolean;
  dayLogs: AttendanceLog[];
  onOpenModal: (dateStr: string) => void;
}) {
  return (
    <div
      style={{ contain: 'layout paint' }}
      onClick={() => {
        if (!isOutOfSemester) onOpenModal(dateStr);
      }}
      className={`p-1 sm:p-1.5 aspect-square rounded-lg transition-colors flex flex-col justify-between ${
        isOutOfSemester
          ? 'opacity-20 pointer-events-none bg-transparent'
          : isToday
          ? 'bg-[#181B1F] border border-white/20 cursor-pointer'
          : dayLogs.length > 0
          ? 'bg-[#181B1F] hover:bg-white/[0.08] cursor-pointer'
          : 'bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer'
      }`}
    >
      <div className="flex items-start justify-between">
        {isToday ? (
          <span className="w-5 h-5 rounded-full bg-white text-slate-950 font-bold flex items-center justify-center text-[10px] font-mono leading-none">
            {dayNum}
          </span>
        ) : (
          <span className="text-[11px] font-mono font-medium text-slate-400 pl-0.5 pt-0.5">
            {dayNum}
          </span>
        )}
      </div>

      {/* Attendance dots: up to 3 dots (Present: teal, Absent: muted red, Cancelled: grey) */}
      <div className="flex items-center justify-center gap-1 pb-1 min-h-[6px]">
        {dayLogs.slice(0, 3).map((l, i) => {
          const dotColor =
            l.status === 'PRESENT'
              ? 'bg-teal-400'
              : l.status === 'ABSENT'
              ? 'bg-rose-400'
              : 'bg-slate-500';
          return (
            <span
              key={l.id || i}
              className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`}
              title={`${l.status}`}
            />
          );
        })}
      </div>
    </div>
  );
});

interface HistoryViewProps {
  logs: AttendanceLog[];
  subjects: Subject[];
  slots: TimetableSlot[];
  holidays?: AcademicHoliday[];
  endDateStr?: string;
  profile?: Profile | null;
  onUpdateLog: (logId: string, newStatus: AttendanceStatus) => void;
  onDeleteLog: (slotId: string, dateStr: string) => void;
}

export default function HistoryView({ 
  logs, 
  subjects, 
  slots, 
  holidays, 
  endDateStr, 
  profile, 
  onUpdateLog, 
  onDeleteLog 
}: HistoryViewProps) {
  const { isLowEnd } = usePerformanceTier();
  const [viewMode, setViewMode] = useState<'CALENDAR' | 'TABLE'>('CALENDAR');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  // Calendar State (Year and Month 0-indexed)
  const now = new Date();
  const [currentYear, setCurrentYear] = useState<number>(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(now.getMonth());
  
  // Modal / Bottom Sheet State
  const [selectedDayModal, setSelectedDayModal] = useState<string | null>(null);
  const [selectedSubjectModal, setSelectedSubjectModal] = useState<string | null>(null);

  const openSubjectModal = (id: string) => {
    setSelectedSubjectModal(id);
    window.history.pushState({ modal: 'subject' }, '', window.location.href);
  };

  const openDayModal = (dateStr: string) => {
    setSelectedDayModal(dateStr);
    window.history.pushState({ modal: 'day' }, '', window.location.href);
  };

  useEffect(() => {
    const handlePopState = () => {
      if (selectedSubjectModal) setSelectedSubjectModal(null);
      if (selectedDayModal) setSelectedDayModal(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedSubjectModal, selectedDayModal]);

  const sortedLogs = [...logs].sort((a, b) => b.log_date.localeCompare(a.log_date));

  const filteredLogs = sortedLogs.filter(log => {
    const sub = subjects.find(s => s.id === log.subject_id);
    const matchesSearch = sub 
      ? `${sub.subject_code} ${sub.subject_name} ${log.log_date}`.toLowerCase().includes(searchTerm.toLowerCase())
      : log.log_date.includes(searchTerm);
    const matchesSubject = filterSubject === 'ALL' || log.subject_id === filterSubject;
    const matchesStatus = filterStatus === 'ALL' || log.status === filterStatus;
    return matchesSearch && matchesSubject && matchesStatus;
  });

  const handleStepMonth = (dir: number) => {
    let m = currentMonth + dir;
    let y = currentYear;
    if (m < 0) { m = 11; y -= 1; }
    else if (m > 11) { m = 0; y += 1; }
    startTransition(() => {
      setCurrentMonth(m);
      setCurrentYear(y);
    });
  };

  const getMonthName = (y: number, m: number) => {
    return new Date(y, m).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Generate calendar grid cells without trailing empty rows
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const calendarCells: Array<{ dayNum: number | null; dateStr: string | null }> = [];

  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push({ dayNum: null, dateStr: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const yStr = String(currentYear);
    const mStr = String(currentMonth + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    calendarCells.push({ dayNum: d, dateStr: `${yStr}-${mStr}-${dStr}` });
  }
  while (calendarCells.length % 7 !== 0) {
    calendarCells.push({ dayNum: null, dateStr: null });
  }
  // Drop any trailing row composed entirely of nulls
  while (calendarCells.length >= 7 && calendarCells.slice(-7).every(c => c.dayNum === null)) {
    calendarCells.splice(-7, 7);
  }

  const modalLogs = selectedDayModal 
    ? logs.filter(l => l.log_date === selectedDayModal && (filterSubject === 'ALL' || l.subject_id === filterSubject))
    : [];

  const [editStatus, setEditStatus] = useState<AttendanceStatus>('PRESENT');

  return (
    <div className="space-y-6 select-none">
      {/* Page Title: Serif on 1-2 lines, icon removed, sentence case */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-white tracking-[-0.02em] [text-wrap:balance]">
            Attendance audit
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review your semester history in a visual monthly grid or chronological table.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center p-1 rounded-lg bg-[#121417] border border-white/[0.06]">
            <button
              onClick={() => {
                startTransition(() => {
                  setViewMode('CALENDAR');
                });
              }}
              className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'CALENDAR' ? 'bg-[#181B1F] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid strokeWidth={1.65} className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => {
                startTransition(() => {
                  setViewMode('TABLE');
                });
              }}
              className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'TABLE' ? 'bg-[#181B1F] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List strokeWidth={1.65} className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 px-3 py-1.5 rounded-lg bg-[#121417] border border-white/[0.06]">
            <span>Logs:</span>
            <span className="text-white font-mono font-semibold tabular-nums">{logs.length}</span>
          </div>
        </div>
      </div>

      {/* Subject-Wise Summary: Sentence-case section label & Compact Rows */}
      <div className="bg-[#121417] p-4 sm:p-5 rounded-xl border border-white/[0.06] space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">
            Subject standing and safe skips
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tap a row to view recovery estimates and timetable projection
          </p>
        </div>

        <div className="flex flex-col space-y-2">
          {subjects.map(s => {
            const subLogs = logs.filter(l => l.subject_id === s.id);
            const present = subLogs.filter(l => l.status === 'PRESENT').length;
            const absent = subLogs.filter(l => l.status === 'ABSENT').length;
            const cancelled = subLogs.filter(l => l.status === 'CANCELLED').length;
            const swapped = subLogs.filter(l => l.status === 'SWAPPED').length;

            const remaining = (slots && holidays && endDateStr) 
              ? calculateRemainingLectures(s.id, slots, holidays, endDateStr) 
              : 0;
            const targetPct = s.target_attendance_percentage || profile?.target_attendance_percentage || 75.0;
            const conductedTillDate = (profile?.semester_start_date && slots && holidays) 
              ? calculateConductedTillDate(s.id, slots, holidays, profile.semester_start_date, Date.now(), 0, cancelled) 
              : undefined;
            const stats = calculateSubjectStats(s, present, absent, cancelled, swapped, remaining, targetPct, conductedTillDate);

            // Grey "Not started" state when conducted = 0
            const isNotStarted = stats.conducted === 0 || (stats.present === 0 && stats.conducted === 0);

            let statusTextColor = '';
            let progressFillColor = '';

            if (isNotStarted) {
              statusTextColor = 'text-slate-500 font-medium';
              progressFillColor = 'bg-slate-700';
            } else if (stats.status === 'SAFE') {
              statusTextColor = 'text-teal-400 font-semibold';
              progressFillColor = 'bg-teal-400';
            } else if (stats.status === 'WARNING') {
              statusTextColor = 'text-amber-400 font-semibold';
              progressFillColor = 'bg-amber-400';
            } else {
              statusTextColor = 'text-rose-400 font-semibold';
              progressFillColor = 'bg-rose-400';
            }

            return (
              <div
                key={s.id}
                onClick={() => openSubjectModal(s.id)}
                style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 110px', contain: 'layout paint' }}
                className="p-3 sm:p-3.5 rounded-lg border border-white/[0.06] bg-[#181B1F] hover:bg-white/[0.04] transition-colors cursor-pointer select-none"
              >
                {/* Top Row: Full Subject Name (no truncation) & Prominent Safe to Skip Figure */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-[11px] font-mono font-medium text-slate-400 bg-white/[0.06] px-1.5 py-0.5 rounded shrink-0">
                        {s.subject_code}
                      </span>
                      <span className="text-sm font-semibold text-white break-words">
                        {s.subject_name}
                      </span>
                    </div>
                  </div>

                  {/* Prominent Figure */}
                  <div className={`text-right shrink-0 text-sm sm:text-base font-mono tabular-nums ${statusTextColor}`}>
                    {isNotStarted ? (
                      <span>Not started</span>
                    ) : stats.status === 'SAFE' || stats.status === 'WARNING' ? (
                      <span>
                        Safe to skip: <strong>{stats.safe_skips}</strong>
                      </span>
                    ) : (
                      <span>
                        Must attend: <strong>{stats.classes_to_attend}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Thin Progress Bar with Threshold Marker Notch */}
                <div className="mt-2.5 relative w-full h-[4px] rounded-full bg-white/[0.08] overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${progressFillColor}`}
                    style={{ width: `${isNotStarted ? 0 : Math.min(100, Math.max(0, stats.current_percentage))}%` }}
                  />
                  {/* Threshold Marker at required target */}
                  <div 
                    className="absolute top-0 bottom-0 w-[1.5px] bg-slate-300 z-10 pointer-events-none"
                    style={{ left: `${Math.min(100, Math.max(0, targetPct))}%` }}
                    title={`Required threshold: ${targetPct}%`}
                  />
                </div>

                {/* Bottom Row: Attended Ratio and Tabular Percentage */}
                <div className="mt-2 flex items-center justify-between text-xs text-slate-400 font-mono tabular-nums">
                  <span>
                    {isNotStarted ? '0 conducted' : `${stats.present} / ${stats.conducted} attended`}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`font-semibold ${isNotStarted ? 'text-slate-500' : 'text-slate-200'}`}>
                      {isNotStarted ? '--%' : `${stats.current_percentage}%`}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      (min {targetPct}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#121417] p-3.5 rounded-xl border border-white/[0.06] flex flex-col md:flex-row gap-3">
        {viewMode === 'TABLE' && (
          <div className="relative flex-1">
            <Search strokeWidth={1.65} className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              aria-label="Search history"
              placeholder="Search by subject code, title, or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#181B1F] pl-9 pr-4 py-2 rounded-lg border border-white/[0.06] text-slate-100 text-xs focus:outline-none"
            />
          </div>
        )}

        {/* Subject Filter */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <Filter strokeWidth={1.65} className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select 
            aria-label="Filter by subject"
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="bg-[#181B1F] px-3 py-2 rounded-lg border border-white/[0.06] text-slate-100 text-xs focus:outline-none w-full sm:w-auto"
          >
            <option value="ALL">All subjects ({subjects.length})</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.subject_code} — {s.subject_name}</option>
            ))}
          </select>

          {viewMode === 'TABLE' && (
            <select 
              aria-label="Filter by status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#181B1F] px-3 py-2 rounded-lg border border-white/[0.06] text-slate-100 text-xs focus:outline-none"
            >
              <option value="ALL">All statuses</option>
              <option value="PRESENT">Present only</option>
              <option value="ABSENT">Absent only</option>
              <option value="CANCELLED">Cancelled only</option>
            </select>
          )}
        </div>
      </div>

      {/* VIEW MODE: CALENDAR GRID */}
      {viewMode === 'CALENDAR' ? (
        <div className="bg-[#121417] rounded-xl p-4 sm:p-5 border border-white/[0.06] space-y-4">
          {/* Month Navigation: "November 2026" on one line */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm sm:text-base font-semibold text-white whitespace-nowrap">
              {getMonthName(currentYear, currentMonth)}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              <button 
                onClick={() => handleStepMonth(-1)}
                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#181B1F] transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft strokeWidth={1.65} className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  const now = new Date();
                  setCurrentYear(now.getFullYear());
                  setCurrentMonth(now.getMonth());
                }}
                className="px-2.5 py-1 rounded bg-[#181B1F] text-slate-300 hover:text-white text-xs font-medium transition-colors"
              >
                Today
              </button>
              <button 
                onClick={() => handleStepMonth(1)}
                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#181B1F] transition-colors"
                aria-label="Next month"
              >
                <ChevronRight strokeWidth={1.65} className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-500">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar Day Grid - Near-square cells */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {calendarCells.map((cell, idx) => {
              if (!cell.dayNum || !cell.dateStr) {
                return <div key={idx} className="aspect-square rounded-lg bg-transparent" />;
              }

              // Dim outside dates and make them non-interactive
              const isOutOfSemester = Boolean(
                (profile?.semester_start_date && cell.dateStr < profile.semester_start_date) ||
                ((profile?.semester_end_date || endDateStr) && cell.dateStr > (profile?.semester_end_date || endDateStr!))
              );

              const dayLogs = logs.filter(l => l.log_date === cell.dateStr && (filterSubject === 'ALL' || l.subject_id === filterSubject));
              const isToday = cell.dateStr === new Date().toISOString().split('T')[0];

              return (
                <CalendarCell
                  key={cell.dateStr}
                  dayNum={cell.dayNum}
                  dateStr={cell.dateStr}
                  isOutOfSemester={isOutOfSemester}
                  isToday={isToday}
                  dayLogs={dayLogs}
                  onOpenModal={openDayModal}
                />
              );
            })}
          </div>

          {/* One-Line Legend */}
          <div className="flex items-center justify-center gap-4 pt-2 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              <span>Present</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>Absent</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              <span>Cancelled</span>
            </span>
          </div>
        </div>
      ) : (
        <TableAuditView 
          filteredLogs={filteredLogs}
          subjects={subjects}
          slots={slots}
          editingLogId={editingLogId}
          setEditingLogId={setEditingLogId}
          editStatus={editStatus}
          setEditStatus={setEditStatus}
          onUpdateLog={onUpdateLog}
          onDeleteLog={onDeleteLog}
        />
      )}

      {/* DAY BOTTOM SHEET */}
      <AnimatePresence>
        {selectedDayModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Scrim */}
            <div 
              onClick={() => setSelectedDayModal(null)}
              className="fixed inset-0 bg-black/80 z-40"
              aria-hidden="true"
            />

            {/* Bottom Sheet Modal */}
            <div 
              className="relative z-50 w-full max-w-lg bg-[#121417] border border-white/[0.06] rounded-t-2xl sm:rounded-xl p-5 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {new Date(selectedDayModal + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {modalLogs.length} logged lecture{modalLogs.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDayModal(null)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X strokeWidth={1.65} className="w-5 h-5" />
                </button>
              </div>

              {/* Logs List in Bottom Sheet */}
              <div className="space-y-2.5">
                {modalLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No attendance logged for this date.</p>
                ) : (
                  modalLogs.map(log => {
                    const sub = subjects.find(s => s.id === log.subject_id);
                    const slot = slots.find(sl => sl.id === log.timetable_slot_id);
                    return (
                      <div key={log.id} className="p-3 rounded-lg bg-[#181B1F] border border-white/[0.06] flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono font-medium text-slate-400 bg-white/[0.06] px-1 rounded">
                              {sub?.subject_code}
                            </span>
                            <span className="text-xs font-medium text-white truncate max-w-[180px]">
                              {sub?.subject_name}
                            </span>
                          </div>
                          {slot && (
                            <span className="text-[10px] font-mono text-slate-500 mt-0.5 block">
                              {slot.start_time} – {slot.end_time}
                            </span>
                          )}
                        </div>

                        {/* Status switcher */}
                        <div className="flex items-center gap-1">
                          {(['PRESENT', 'ABSENT', 'CANCELLED'] as AttendanceStatus[]).map(st => (
                            <button
                              key={st}
                              onClick={() => onUpdateLog(log.id, st)}
                              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                log.status === st
                                  ? st === 'PRESENT' ? 'bg-teal-600 text-white' : st === 'ABSENT' ? 'bg-rose-500 text-white' : 'bg-white/20 text-white'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {st === 'PRESENT' ? 'P' : st === 'ABSENT' ? 'A' : 'C'}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
