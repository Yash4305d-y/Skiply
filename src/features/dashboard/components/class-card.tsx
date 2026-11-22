'use client';

import React, { useState } from 'react';
import { Check, X, Ban, RefreshCw, MapPin, ArrowRightLeft } from 'lucide-react';
import { DailyClassItem, AttendanceStatus, Subject } from '@/types';

interface ClassCardProps {
  item: DailyClassItem;
  allSubjects: Subject[];
  onMarkAttendance: (slotId: string, subjectId: string, status: AttendanceStatus, swappedSubjectId?: string) => void;
  onUndoAttendance: (slotId: string) => void;
}

export default function ClassCard({ item, allSubjects, onMarkAttendance, onUndoAttendance }: ClassCardProps) {
  const [isSwapping, setIsSwapping] = useState(false);
  const [selectedSwapSubject, setSelectedSwapSubject] = useState<string>(item.subject_id);

  const currentStatus = item.current_log?.status;
  const isMarked = Boolean(currentStatus);

  const stats = item.stats;
  const isDanger = stats.status === 'DANGER';
  const isWarning = stats.status === 'WARNING';

  const handleTap = (status: AttendanceStatus) => {
    if (status === 'SWAPPED') {
      onMarkAttendance(item.slot_id, item.subject_id, 'SWAPPED', selectedSwapSubject);
      setIsSwapping(false);
    } else {
      onMarkAttendance(item.slot_id, item.subject_id, status);
    }
  };

  return (
    <div 
      className={`group relative rounded-xl p-3 sm:px-4 sm:py-3 transition-colors border select-none ${
        isMarked && currentStatus === 'PRESENT' 
          ? 'border-teal-500/30 bg-[#121417]' 
          : isMarked && currentStatus === 'ABSENT' 
          ? 'border-rose-500/30 bg-[#121417]'
          : isMarked && currentStatus === 'CANCELLED' 
          ? 'border-white/10 bg-[#121417]'
          : isMarked && currentStatus === 'SWAPPED' 
          ? 'border-white/10 bg-[#121417]'
          : 'border-white/[0.06] bg-[#121417]'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Side: Time and Subject */}
        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
          {/* Time (Compact) */}
          <div className="flex flex-col sm:w-20 shrink-0 text-slate-400 font-mono">
            <span className="text-xs font-semibold text-slate-200 tabular-nums">{item.start_time}</span>
            <span className="text-[10px] text-slate-500 tabular-nums">{item.end_time}</span>
          </div>

          {/* Subject Badge & Info */}
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-medium text-slate-300 bg-[#181B1F] border border-white/[0.06] shrink-0">
                {item.subject_code}
              </span>
              <h3 className="text-sm font-semibold text-white truncate">
                {item.subject_name}
              </h3>
              {item.is_lab && (
                <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300 text-[10px] font-medium">
                  Lab
                </span>
              )}
              {item.room_number && (
                <span className="flex items-center gap-0.5 text-[11px] text-slate-400">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  {item.room_number}
                </span>
              )}
            </div>
            
            {/* Stats inline */}
            <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
              <span className={`font-semibold ${
                isDanger ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-slate-200'
              }`}>
                {stats.current_percentage}%
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">
                {isDanger ? (
                  <span className="text-rose-400">Must attend {stats.classes_to_attend}</span>
                ) : (
                  <span>Safe to skip: <strong className="text-teal-400 font-semibold">{stats.safe_skips}</strong></span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Actions */}
        <div className="flex items-center justify-end gap-1.5 shrink-0">
          {isMarked ? (
            <div className="flex items-center gap-1.5">
              <div className={`px-2.5 py-1 rounded-lg font-medium text-xs flex items-center gap-1 border ${
                currentStatus === 'PRESENT' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' :
                currentStatus === 'ABSENT' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                currentStatus === 'CANCELLED' ? 'bg-white/[0.06] text-slate-400 border-white/10' :
                'bg-white/[0.06] text-slate-300 border-white/10'
              }`}>
                {currentStatus === 'PRESENT' && <Check className="w-3.5 h-3.5" />}
                {currentStatus === 'ABSENT' && <X className="w-3.5 h-3.5" />}
                {currentStatus === 'CANCELLED' && <Ban className="w-3.5 h-3.5" />}
                {currentStatus === 'SWAPPED' && <ArrowRightLeft className="w-3.5 h-3.5" />}
                <span>
                  {currentStatus === 'PRESENT' ? 'Present' : currentStatus === 'ABSENT' ? 'Absent' : currentStatus === 'CANCELLED' ? 'Cancelled' : 'Swapped'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onUndoAttendance(item.slot_id)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
                title="Undo attendance"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleTap('PRESENT')}
                className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs flex items-center gap-1 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Present</span>
              </button>
              <button
                type="button"
                onClick={() => handleTap('ABSENT')}
                className="px-2.5 py-1.5 rounded-lg bg-[#181B1F] hover:bg-white/10 text-slate-300 border border-white/[0.06] font-medium text-xs flex items-center gap-1 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Absent</span>
              </button>
              <button
                type="button"
                onClick={() => handleTap('CANCELLED')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
                title="Mark Cancelled"
              >
                <Ban className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsSwapping(!isSwapping)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
                title="Swap Subject"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Swapping Dropdown Drawer if open */}
      {isSwapping && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center gap-2">
          <span className="text-xs text-slate-400">Swap with:</span>
          <select
            value={selectedSwapSubject}
            onChange={(e) => setSelectedSwapSubject(e.target.value)}
            className="bg-[#181B1F] border border-white/10 rounded-lg text-xs text-white px-2 py-1 flex-1 outline-none"
          >
            {allSubjects
              .filter(s => s.id !== item.subject_id)
              .map(s => (
                <option key={s.id} value={s.id}>
                  {s.subject_code} — {s.subject_name}
                </option>
              ))}
          </select>
          <button
            type="button"
            onClick={() => handleTap('SWAPPED')}
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium"
          >
            Confirm
          </button>
          <button
            type="button"
            onClick={() => setIsSwapping(false)}
            className="px-2 py-1 text-xs text-slate-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
