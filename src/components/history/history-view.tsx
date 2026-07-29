'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History as HistoryIcon, Search, Filter, Trash2, Edit2, Check, X, Ban, 
  ArrowRightLeft, Calendar as CalendarIcon, Grid, List, ChevronLeft, ChevronRight,
  ShieldCheck, AlertTriangle 
} from 'lucide-react';
import { AttendanceLog, Subject, TimetableSlot, AttendanceStatus, AcademicHoliday, Profile } from '@/types';
import { calculateRemainingLectures, calculateSubjectStats, calculateConductedTillDate } from '@/lib/math-engine';

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

export default function HistoryView({ logs, subjects, slots, holidays, endDateStr, profile, onUpdateLog, onDeleteLog }: HistoryViewProps) {
  const [viewMode, setViewMode] = useState<'CALENDAR' | 'TABLE'>('CALENDAR');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  // Calendar State (Year and Month 0-indexed)
  const now = new Date();
  const [currentYear, setCurrentYear] = useState<number>(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(now.getMonth());
  
  // Modal States
  const [selectedDayModal, setSelectedDayModal] = useState<string | null>(null);
  const [selectedSubjectModal, setSelectedSubjectModal] = useState<string | null>(null);

  // Sort logs by date descending (most recent first)
  const sortedLogs = [...logs].sort((a, b) => b.log_date.localeCompare(a.log_date));

  // Filter logs for Table / General Search
  const filteredLogs = sortedLogs.filter(log => {
    const sub = subjects.find(s => s.id === log.subject_id);
    const matchesSearch = sub 
      ? `${sub.subject_code} ${sub.subject_name} ${log.log_date}`.toLowerCase().includes(searchTerm.toLowerCase())
      : log.log_date.includes(searchTerm);
    const matchesSubject = filterSubject === 'ALL' || log.subject_id === filterSubject;
    const matchesStatus = filterStatus === 'ALL' || log.status === filterStatus;
    return matchesSearch && matchesSubject && matchesStatus;
  });

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'PRESENT':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold"><Check className="w-3.5 h-3.5" /> Present</span>;
      case 'ABSENT':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold"><X className="w-3.5 h-3.5" /> Absent</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold"><Ban className="w-3.5 h-3.5" /> Cancelled</span>;
      case 'SWAPPED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-bold"><ArrowRightLeft className="w-3.5 h-3.5" /> Swapped</span>;
    }
  };

  // Calendar Helpers
  const handleStepMonth = (dir: number) => {
    let m = currentMonth + dir;
    let y = currentYear;
    if (m < 0) { m = 11; y -= 1; }
    else if (m > 11) { m = 0; y += 1; }
    setCurrentMonth(m);
    setCurrentYear(y);
  };

  const getMonthName = (y: number, m: number) => {
    return new Date(y, m).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Generate calendar grid cells (42 cells: 6 weeks)
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
  while (calendarCells.length < 42) {
    calendarCells.push({ dayNum: null, dateStr: null });
  }

  // Logs for selected day in modal
  const modalLogs = selectedDayModal 
    ? logs.filter(l => l.log_date === selectedDayModal && (filterSubject === 'ALL' || l.subject_id === filterSubject))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <HistoryIcon className="w-6 h-6 text-teal-400" />
            <span>Attendance Audit & Visual Calendar</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review your semester history in a visual monthly grid or chronological table. Click any date to edit past logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setViewMode('CALENDAR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'CALENDAR' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Calendar Grid</span>
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'TABLE' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table Audit</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
            <span>Total Logs:</span>
            <strong className="text-white font-bold">{logs.length}</strong>
          </div>
        </div>
      </div>

      {/* Subject-Wise Attendance Summary Banner */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl border border-white/5 space-y-3 bg-transparent">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Subject-Wise Attendance Standing & AI Insights</span>
          </span>
          <span className="text-[11px] text-slate-400">Tap any subject card below to view detailed AI skip/recovery predictions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
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
            const isSelected = filterSubject === s.id;

            return (
              <motion.div
                key={s.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedSubjectModal(s.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected 
                    ? 'bg-slate-800 border-teal-500/50 ring-1 ring-teal-500/50 shadow-sm' 
                    : 'bg-slate-900 border-white/5 hover:border-white/10 hover:bg-slate-800/50'
                }`}
                title="Tap to see detailed AI attendance predictions and numbers"
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-base">📘</span>
                    <span 
                      className="px-2 py-0.5 rounded text-[10px] font-black text-white truncate max-w-[85px]" 
                      style={{ backgroundColor: s.color_hex || '#6366f1' }}
                    >
                      {s.subject_code}
                    </span>
                  </div>
                  <span className={`text-base font-extrabold font-mono ${
                    stats.current_percentage >= targetPct ? 'text-emerald-400' : stats.current_percentage >= (targetPct - 10) ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {stats.current_percentage}%
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span className="text-slate-400 font-normal truncate max-w-[90px]">{s.subject_name}</span>
                    <span className="font-mono text-white font-bold">{stats.present} / {stats.conducted} Till Date</span>
                  </div>

                  {/* Safe Skip / Recovery Insight */}
                  <div className="pt-0.5">
                    {stats.status === 'SAFE' && (
                      <div className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                        <span>🟢</span>
                        <span className="truncate">Safe to skip: {stats.safe_skips}</span>
                      </div>
                    )}
                    {stats.status === 'WARNING' && (
                      <div className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                        <span>🟡</span>
                        <span className="truncate">Safe to skip: {stats.safe_skips} (Border)</span>
                      </div>
                    )}
                    {stats.status === 'DANGER' && (
                      <div className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                        <span>🔴</span>
                        <span className="truncate">Must attend next: {stats.classes_to_attend}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60 font-medium">
                    <span>Trend:</span>
                    <span className="text-emerald-400 flex items-center gap-0.5 font-bold">↑ Stable</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card p-4 rounded-2xl border-slate-800 flex flex-col md:flex-row gap-3">
        {viewMode === 'TABLE' && (
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text"
              placeholder="Search by subject code, title, or date (YYYY-MM-DD)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 pl-9 pr-4 py-2 rounded-lg border border-white/5 text-slate-100 text-xs focus:outline-none focus:border-teal-500/50"
            />
          </div>
        )}

        {/* Subject Filter */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select 
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="bg-slate-900 px-3 py-2 rounded-lg border border-white/5 text-slate-100 text-xs focus:outline-none focus:border-teal-500/50 w-full sm:w-auto"
          >
            <option value="ALL">All Subjects ({subjects.length})</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.subject_code} — {s.subject_name}</option>
            ))}
          </select>

          {viewMode === 'TABLE' && (
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">Present Only</option>
              <option value="ABSENT">Absent Only</option>
              <option value="CANCELLED">Cancelled Only</option>
              <option value="SWAPPED">Swapped Only</option>
            </select>
          )}
        </div>
      </div>

      {/* VIEW MODE: CALENDAR GRID */}
      {viewMode === 'CALENDAR' ? (
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">{getMonthName(currentYear, currentMonth)}</h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleStepMonth(-1)}
                className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  const now = new Date();
                  setCurrentYear(now.getFullYear());
                  setCurrentMonth(now.getMonth());
                }}
                className="px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500 hover:text-white text-xs font-bold transition-colors border border-teal-500/20"
              >
                Today
              </button>
              <button 
                onClick={() => handleStepMonth(1)}
                className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Header */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((cell, idx) => {
              if (!cell.dayNum || !cell.dateStr) {
                return <div key={idx} className="min-h-[90px] rounded-xl bg-slate-900/20 border border-slate-900/40 opacity-30 pointer-events-none" />;
              }

              // Find matching logs for this date
              const dayLogs = logs.filter(l => l.log_date === cell.dateStr && (filterSubject === 'ALL' || l.subject_id === filterSubject));
              const isToday = cell.dateStr === new Date().toISOString().split('T')[0];

              return (
                <motion.div
                  key={cell.dateStr}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedDayModal(cell.dateStr)}
                  className={`min-h-[90px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isToday ? 'bg-slate-800/40 border-teal-500/30 ring-1 ring-teal-500/20' :
                    dayLogs.length > 0 ? 'bg-slate-900 border-white/5 hover:border-white/10' :
                    'bg-slate-900/30 border-white/5 hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isToday ? 'text-teal-400 bg-teal-500/20 px-1.5 py-0.5 rounded' : 'text-slate-300'}`}>
                      {cell.dayNum}
                    </span>
                    {dayLogs.length > 0 && (
                      <span className="text-[10px] text-slate-500 font-mono">{dayLogs.length} log{dayLogs.length > 1 ? 's' : ''}</span>
                    )}
                  </div>

                  {/* Color-coded badges / dots */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {dayLogs.slice(0, 4).map(l => {
                      const sub = subjects.find(s => s.id === l.subject_id);
                      const bg = l.status === 'PRESENT' ? 'bg-emerald-500' :
                                 l.status === 'ABSENT' ? 'bg-rose-500' :
                                 l.status === 'CANCELLED' ? 'bg-amber-500' : 'bg-sky-500';
                      return (
                        <div 
                          key={l.id} 
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold text-white bg-slate-800/90 border border-slate-700 truncate max-w-full"
                          title={`${sub?.subject_code}: ${l.status}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${bg} flex-shrink-0`} />
                          <span className="truncate">{sub?.subject_code || 'SUB'}</span>
                        </div>
                      );
                    })}
                    {dayLogs.length > 4 && (
                      <span className="text-[9px] text-slate-400 font-bold px-1 py-0.5 bg-slate-800 rounded">
                        +{dayLogs.length - 4}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VIEW MODE: TABLE AUDIT */
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <CalendarIcon className="w-10 h-10 mx-auto opacity-40" />
              <p className="text-sm font-semibold text-slate-400">No matching attendance records found</p>
              <p className="text-xs">Try adjusting your filters or searching for a different keyword.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/70 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold">Subject</th>
                    <th className="p-4 font-semibold">Time Slot</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs">
                  {filteredLogs.map(log => {
                    const sub = subjects.find(s => s.id === log.subject_id);
                    const slot = slots.find(sl => sl.id === log.timetable_slot_id);
                    const isEditing = editingLogId === log.id;

                    return (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-mono font-medium text-slate-300">
                          {log.log_date}
                        </td>
                        <td className="p-4">
                          {sub ? (
                            <div className="flex items-center gap-2">
                              <span 
                                className="px-2 py-0.5 rounded text-[11px] font-bold text-white" 
                                style={{ backgroundColor: sub.color_hex || '#6366f1' }}
                              >
                                {sub.subject_code}
                              </span>
                              <span className="font-semibold text-white">{sub.subject_name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">Unknown Subject</span>
                          )}
                        </td>
                        <td className="p-4 text-slate-400">
                          {slot ? `${slot.start_time} - ${slot.end_time}` : 'Manual / Custom Slot'}
                        </td>
                        <td className="p-4">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              {(['PRESENT', 'ABSENT', 'CANCELLED', 'SWAPPED'] as AttendanceStatus[]).map(st => (
                                <button
                                  key={st}
                                  onClick={() => {
                                    onUpdateLog(log.id, st);
                                    setEditingLogId(null);
                                  }}
                                  className={`px-2 py-1 rounded text-[10px] font-bold ${
                                    log.status === st ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          ) : (
                            getStatusBadge(log.status)
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingLogId(isEditing ? null : log.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="Edit status"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Remove log for ${sub?.subject_code} on ${log.log_date}?`)) {
                                  onDeleteLog(log.timetable_slot_id || '', log.log_date);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition-colors"
                              title="Delete log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* INTERACTIVE DAY DRAWER / MODAL */}
      <AnimatePresence>
        {selectedDayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card w-full max-w-lg p-6 rounded-2xl border border-white/10 space-y-6 bg-slate-950 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                    Day Audit Sheet
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">
                    {new Date(selectedDayModal + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedDayModal(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-500 space-y-2">
                  <CalendarIcon className="w-8 h-8 mx-auto opacity-40" />
                  <p className="text-xs font-semibold">No attendance logged on this date for the selected filter.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {modalLogs.map(log => {
                    const sub = subjects.find(s => s.id === log.subject_id);
                    const slot = slots.find(sl => sl.id === log.timetable_slot_id);
                    return (
                      <div key={log.id} className="p-3.5 rounded-xl bg-slate-900 border border-white/5 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold text-white" style={{ backgroundColor: sub?.color_hex || '#6366f1' }}>
                              {sub?.subject_code || 'SUB'}
                            </span>
                            <span className="text-xs font-bold text-white">{sub?.subject_name}</span>
                          </div>
                          {getStatusBadge(log.status)}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50 text-[11px]">
                          <span className="text-slate-400">
                            {slot ? `${slot.start_time} - ${slot.end_time}` : 'Manual Entry'}
                          </span>
                          <div className="flex items-center gap-1">
                            {(['PRESENT', 'ABSENT', 'CANCELLED'] as AttendanceStatus[]).map(st => (
                              <button
                                key={st}
                                onClick={() => onUpdateLog(log.id, st)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                  log.status === st ? 'bg-teal-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                            <button
                              onClick={() => {
                                onDeleteLog(log.timetable_slot_id || '', log.log_date);
                                if (modalLogs.length === 1) setSelectedDayModal(null);
                              }}
                              className="p-1 rounded bg-slate-900 text-slate-500 hover:text-rose-400 ml-1 transition-colors"
                              title="Delete log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedDayModal(null)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Subject Details & AI Prediction Modal */}
        {selectedSubjectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-950 border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5"
            >
              {(() => {
                const sub = subjects.find(s => s.id === selectedSubjectModal);
                if (!sub) return null;
                const subLogs = logs.filter(l => l.subject_id === sub.id);
                const present = subLogs.filter(l => l.status === 'PRESENT').length;
                const absent = subLogs.filter(l => l.status === 'ABSENT').length;
                const cancelled = subLogs.filter(l => l.status === 'CANCELLED').length;
                const swapped = subLogs.filter(l => l.status === 'SWAPPED').length;
                const remaining = (slots && holidays && endDateStr) 
                  ? calculateRemainingLectures(sub.id, slots, holidays, endDateStr) 
                  : 0;
                const targetPct = sub.target_attendance_percentage || profile?.target_attendance_percentage || 75.0;
                const conductedTillDate = (profile?.semester_start_date && slots && holidays) 
                  ? calculateConductedTillDate(sub.id, slots, holidays, profile.semester_start_date, Date.now(), 0, cancelled) 
                  : undefined;
                const stats = calculateSubjectStats(sub, present, absent, cancelled, swapped, remaining, targetPct, conductedTillDate);

                return (
                  <>
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📘</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span 
                              className="px-2.5 py-0.5 rounded text-xs font-black text-white"
                              style={{ backgroundColor: sub.color_hex || '#6366f1' }}
                            >
                              {sub.subject_code}
                            </span>
                            <h3 className="text-lg font-extrabold text-white">{sub.subject_name}</h3>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">Detailed Attendance Standing & AI Predictions</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedSubjectModal(null)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Four Core Numbers Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 text-center space-y-1">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Attended</span>
                        <p className="text-xl font-black text-emerald-400 font-mono">{stats.present}</p>
                        <span className="text-[9px] text-slate-500">Present</span>
                      </div>
                      <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 text-center space-y-1">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Missed</span>
                        <p className="text-xl font-black text-rose-400 font-mono">{stats.absent}</p>
                        <span className="text-[9px] text-slate-500">Absent</span>
                      </div>
                      <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 text-center space-y-1">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Till Date</span>
                        <p className="text-xl font-black text-teal-400 font-mono">{stats.conducted}</p>
                        <span className="text-[9px] text-slate-500">Conducted</span>
                      </div>
                      <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 text-center space-y-1">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sem Total</span>
                        <p className="text-xl font-black text-white font-mono">{stats.total_available}</p>
                        <span className="text-[9px] text-slate-500">Total Available</span>
                      </div>
                    </div>

                    {/* Attendance Percentage & Target Bar */}
                    <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-400">Current Attendance % (Till Date)</span>
                          <div className="text-2xl font-black text-white font-mono flex items-baseline gap-2">
                            <span>{stats.current_percentage}%</span>
                            <span className="text-xs font-normal text-slate-400">
                              ({stats.present} / {stats.conducted} classes till date)
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400">Required Target</span>
                          <div className="text-base font-bold text-teal-400 font-mono">{targetPct}%</div>
                        </div>
                      </div>
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            stats.current_percentage >= targetPct ? 'bg-emerald-500' : stats.current_percentage >= (targetPct - 10) ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, stats.current_percentage)}%` }}
                        />
                      </div>
                    </div>

                    {/* AI Prediction Box */}
                    <div className={`p-4 rounded-2xl border space-y-2 ${
                      stats.status === 'SAFE' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
                      stats.status === 'WARNING' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' :
                      'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}>
                      <div className="flex items-center gap-2 font-extrabold text-sm">
                        <span>{stats.status === 'SAFE' ? '🟢 Skip Prediction' : stats.status === 'WARNING' ? '🟡 Borderline Warning' : '🔴 Recovery Prediction'}</span>
                      </div>
                      <p className="text-xs leading-relaxed font-medium">
                        {stats.status === 'SAFE' && (
                          <>
                            You can safely skip up to <strong className="text-white underline">{stats.safe_skips} more class(es)</strong>. 
                            If you skip {stats.safe_skips} class{stats.safe_skips !== 1 ? 'es' : ''}, your attendance will be{' '}
                            <strong className="font-mono text-white">
                              {Math.round((stats.present / (stats.total_available + stats.safe_skips)) * 1000) / 10}%
                            </strong>
                            , keeping you safely above your {targetPct}% requirement!
                          </>
                        )}
                        {stats.status === 'WARNING' && (
                          <>
                            You are right at the border of {targetPct}%! You cannot skip any more classes right now without dropping into the Danger Zone.
                          </>
                        )}
                        {stats.status === 'DANGER' && (
                          <>
                            You are currently below your {targetPct}% target! You must attend the next{' '}
                            <strong className="text-white underline">{stats.classes_to_attend} consecutive class(es)</strong>{' '}
                            to recover and reach{' '}
                            <strong className="font-mono text-white">
                              {Math.round(((stats.present + stats.classes_to_attend) / stats.total_available) * 1000) / 10}%
                            </strong>.
                          </>
                        )}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-3 pt-2">
                      <button
                        onClick={() => {
                          setFilterSubject(sub.id);
                          setSelectedSubjectModal(null);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
                      >
                        <Filter className="w-3.5 h-3.5" />
                        <span>Filter Audit Calendar by {sub.subject_code}</span>
                      </button>

                      <button
                        onClick={() => setSelectedSubjectModal(null)}
                        className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all"
                      >
                        Close
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
