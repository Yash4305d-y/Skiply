'use client';

import React, { useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sun } from 'lucide-react';
import NextLink from 'next/link';
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
  semesterStartDate?: string;
  semesterEndDate?: string;
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
  semesterStartDate,
  semesterEndDate,
}: DailyClassListProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Check if selectedDate is a holiday
  const localHoliday = holidays.find(h => h.holiday_date === selectedDate);
  const activeHolidayName = cloudHolidayName || (localHoliday ? localHoliday.description : null);
  const activeHoliday = Boolean(cloudHolidayName || localHoliday);

  const markedCount = items.filter(i => Boolean(i.current_log)).length;
  const totalCount = items.length;

  const handleStepDate = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
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

  const getOutOfSemesterTitle = () => {
    if (semesterEndDate && selectedDate > semesterEndDate) {
      const [y, m, d] = semesterEndDate.split('-').map(Number);
      const dObj = new Date(y, m - 1, d);
      const formatted = dObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      return `Semester ended ${formatted}`;
    }
    if (semesterStartDate && selectedDate < semesterStartDate) {
      const [y, m, d] = semesterStartDate.split('-').map(Number);
      const dObj = new Date(y, m - 1, d);
      const formatted = dObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      return `Semester starts ${formatted}`;
    }
    return 'Outside semester dates';
  };

  return (
    <div className="space-y-4 select-none">
      {/* Date Row: "Sunday, Nov 22" with "Today" badge + Quiet Control Group */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white whitespace-nowrap">
              {formatDateDisplay(selectedDate)}
            </h3>
            {isToday() && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-slate-300 bg-[#181B1F] border border-white/[0.06]">
                Today
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {activeHoliday ? (
              <span className="text-amber-400 font-medium">Holiday: {activeHolidayName}</span>
            ) : totalCount > 0 ? (
              <span>Marked {markedCount} of {totalCount} scheduled lecture{totalCount !== 1 ? 's' : ''}</span>
            ) : (
              <span>No lectures scheduled</span>
            )}
          </p>
        </div>

        {/* Quiet Control Group: prev / today / calendar / next */}
        <div className="inline-flex items-center bg-[#121417] p-1 rounded-lg border border-white/[0.06] self-start sm:self-auto">
          <button
            onClick={() => handleStepDate(-1)}
            className="p-1.5 rounded text-slate-400 hover:bg-[#181B1F] hover:text-white transition-colors"
            aria-label="Previous day"
            title="Previous day"
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
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              isToday() ? 'bg-[#181B1F] text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Today
          </button>

          <div className="relative">
            <input
              ref={dateInputRef}
              type="date"
              aria-label="Select date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) onDateChange(e.target.value);
              }}
              className="absolute w-0 h-0 opacity-0 overflow-hidden pointer-events-none"
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
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#181B1F] transition-colors"
              aria-label="Pick date from calendar"
              title="Pick date"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => handleStepDate(1)}
            className="p-1.5 rounded text-slate-400 hover:bg-[#181B1F] hover:text-white transition-colors"
            aria-label="Next day"
            title="Next day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Holiday Banner if present */}
      {activeHoliday && (
        <div className="p-4 rounded-xl border border-white/[0.06] flex items-center gap-3 bg-[#121417]">
          <Sun className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-white">{activeHolidayName}</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Academic holiday — scheduled classes are suspended.
            </p>
          </div>
        </div>
      )}

      {/* Out of Semester: Actionable Empty State */}
      {isOutOfSemesterBounds && !activeHoliday && (
        <div className="p-5 rounded-xl border border-white/[0.06] bg-[#121417] text-left space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-white">{getOutOfSemesterTitle()}</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Attendance logging is only active during your configured semester timeline.
            </p>
          </div>
          <div>
            <NextLink
              href="/onboarding"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium transition-colors"
            >
              Update semester dates
            </NextLink>
          </div>
        </div>
      )}

      {/* Class List or Neutral "No lectures today" Empty State */}
      <div className="space-y-2.5">
        {activeHoliday || isOutOfSemesterBounds ? null : items.length === 0 ? (
          <div className="p-6 rounded-xl text-center space-y-1 border border-white/[0.06] bg-[#121417]">
            <h4 className="text-sm font-semibold text-slate-200">No lectures today</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              No classes are scheduled on this day of the week.
            </p>
          </div>
        ) : (
          items.map(item => (
            <ClassCard
              key={item.slot_id}
              item={item}
              allSubjects={allSubjects}
              onMarkAttendance={onMarkAttendance}
              onUndoAttendance={onUndoAttendance}
            />
          ))
        )}
      </div>
    </div>
  );
}
