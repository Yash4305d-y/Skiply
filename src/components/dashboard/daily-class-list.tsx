'use client';

import React, { useState } from 'react';
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
}

export default function DailyClassList({
  items,
  allSubjects,
  holidays,
  selectedDate,
  onDateChange,
  onMarkAttendance,
  onUndoAttendance,
}: DailyClassListProps) {
  // Check if selectedDate is a holiday
  const activeHoliday = holidays.find(h => h.holiday_date === selectedDate);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">{formatDateDisplay(selectedDate)}</h3>
              {isToday() && (
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Today
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {activeHoliday ? (
                <span className="text-amber-400 font-medium">🏖️ Holiday: {activeHoliday.description}</span>
              ) : totalCount > 0 ? (
                <span>Marked {markedCount} of {totalCount} scheduled lecture{totalCount !== 1 ? 's' : ''}</span>
              ) : (
                <span>No lectures scheduled on this day of the week</span>
              )}
            </p>
          </div>
        </div>

        {/* Date Stepper & Picker Buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap justify-end">
          <button
            onClick={() => handleStepDate(-1)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Previous Day"
            aria-label="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Direct Date Picker Button */}
          <div className="relative group">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  onDateChange(e.target.value);
                }
              }}
              className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
              title="Select specific date"
              aria-label="Select specific date"
            />
            <button
              type="button"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 shadow-sm"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="hidden xs:inline">Jump to Date...</span>
              <span className="xs:hidden">Date...</span>
            </button>
          </div>

          {!isToday() && (
            <button
              onClick={() => {
                const now = new Date();
                const y = now.getFullYear();
                const m = String(now.getMonth() + 1).padStart(2, '0');
                const d = String(now.getDate()).padStart(2, '0');
                onDateChange(`${y}-${m}-${d}`);
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white text-xs font-bold transition-all shadow-sm"
            >
              Today
            </button>
          )}

          <button
            onClick={() => handleStepDate(1)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Next Day"
            aria-label="Next Day"
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
          className="glass-card p-6 rounded-2xl bg-gradient-to-r from-amber-950/30 to-slate-900 border-amber-500/40 flex items-center gap-4 text-amber-200"
        >
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400">
            <Sun className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white">{activeHoliday.description}</h4>
            <p className="text-xs text-amber-300/80">
              {activeHoliday.is_exam_day ? '📝 Mid-Term / Assessment Day — No regular lectures scheduled.' : '🏖️ Academic holiday or break — All scheduled classes are suspended.'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Class List or Empty State */}
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl text-center space-y-4 border-dashed border-slate-800">
            <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mx-auto text-slate-500">
              <Sun className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">No Lectures Today</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                You have a free day! Use the date switcher above to check your upcoming schedule or review past attendance.
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
