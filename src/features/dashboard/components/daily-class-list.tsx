'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2, Sparkles, Sun } from 'lucide-react';
import { DailyClassItem, AttendanceStatus, Subject, AcademicHoliday } from '@/types';
import ClassCard from './class-card';

interface DailyClassListProps {
  items: DailyClassItem[];
  allSubjects: Subject[];
  holidays: AcademicHoliday[];
  selectedDate: string;
  onDateChange: (newDateStr: string) => void;
  onMarkAttendance: (slotId: string, subjectId: string, status: AttendanceStatus, swappedSubjectId?: string) => void;
  onUndoAttendance: (slotId: string) => void;
  isOutOfSemesterBounds?: boolean;
  cloudHolidayName?: string | null;
}

export default function DailyClassList({
  items,
  allSubjects,
  holidays,
  selectedDate,
  onDateChange,
  onMarkAttendance,
  onUndoAttendance,
  isOutOfSemesterBounds,
  cloudHolidayName,
}: DailyClassListProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Check if selectedDate is a holiday
  const localHoliday = holidays.find(h => h.holiday_date === selectedDate);
  const activeHolidayName = cloudHolidayName || (localHoliday ? localHoliday.description : null);
  const activeHoliday = cloudHolidayName || localHoliday;

  const markedCount = items.filter(i => Boolean(i.current_log)).length;
  const totalCount = items.length;

  // Helpers for date stepping
  const handleStepDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    onDateChange(`${year}-${month}-${day}`);
  };

  const isToday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return selectedDate === `${year}-${month}-${day}`;
  };

  const formatDateDisplay = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header & Date Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-white">{formatDateDisplay(selectedDate)}</h3>
            {isToday() && (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-400 border border-teal-500/30">
                Today
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {activeHoliday ? (
              <span className="text-amber-400 font-medium">🏖️ Holiday: {activeHolidayName}</span>
            ) : totalCount > 0 ? (
              <span>Marked {markedCount} of {totalCount} scheduled lecture{totalCount !== 1 ? 's' : ''}</span>
            ) : (
              <span>No lectures scheduled on this day of the week</span>
            )}
          </p>
        </div>

        {/* Date Segmented Control */}
        <div className="flex items-center bg-slate-900/50 p-1 rounded-xl border border-white/5 shadow-sm self-start sm:self-auto">
          <button
            onClick={() => handleStepDate(-1)}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors active:scale-95"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              const now = new Date();
              const y = now.getFullYear();
              const m = String(now.getMonth() + 1).padStart(2, '0');
              const d = String(now.getDate()).padStart(2, '0');
              onDateChange(`${y}-${m}-${d}`);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              isToday() ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Today
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          <div className="relative group">
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  onDateChange(e.target.value);
                }
              }}
              className="absolute w-0 h-0 opacity-0 overflow-hidden"
            />
            <button
              type="button"
              onClick={() => {
                if (dateInputRef.current) {
                  if (typeof dateInputRef.current.showPicker === 'function') {
                    dateInputRef.current.showPicker();
                  } else {
                    dateInputRef.current.focus();
                  }
                }
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Select Date</span>
            </button>
          </div>

          <button
            onClick={() => handleStepDate(1)}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors active:scale-95"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Holiday Banner if present */}
      {activeHoliday && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="glass-card p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center gap-4 text-amber-200"
        >
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <Sun className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white">{activeHolidayName}</h4>
            <p className="text-xs text-amber-300/80">
              🏖️ Academic holiday or break — All scheduled classes are suspended.
            </p>
          </div>
        </motion.div>
      )}

      {/* Out of Semester Banner */}
      {isOutOfSemesterBounds && !activeHoliday && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="glass-card p-6 rounded-2xl bg-teal-500/5 border border-teal-500/20 flex items-center gap-4 text-teal-200"
        >
          <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400">
            <CalendarIcon className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white">Outside Semester Dates</h4>
            <p className="text-xs text-teal-300/80">
              This date is outside your configured semester start and end dates. Attendance marking is disabled.
            </p>
          </div>
        </motion.div>
      )}

      {/* Class List or Empty State */}
      <div className="space-y-4">
        {activeHoliday || isOutOfSemesterBounds ? null : items.length === 0 ? (
          <div className="glass-card p-12 rounded-2xl text-center space-y-4 border border-white/5 bg-slate-900/20">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto text-slate-500 border border-white/5 shadow-inner">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">No Lectures Scheduled</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                You have a free day! Use the date switcher above to check your upcoming schedule.
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {items.map(item => (
              <ClassCard
                key={item.slot_id}
                item={item}
                allSubjects={allSubjects}
                onMarkAttendance={onMarkAttendance}
                onUndoAttendance={onUndoAttendance}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
