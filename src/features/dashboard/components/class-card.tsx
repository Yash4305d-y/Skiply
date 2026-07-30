'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Ban, RefreshCw, MapPin, Clock, AlertTriangle, ShieldCheck, ArrowRightLeft } from 'lucide-react';
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
    <motion.div 
      layout
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
      }}
      className={`group relative glass-card glass-card-hover rounded-2xl p-3 sm:px-4 sm:py-3 transition-colors border ${
        isMarked && currentStatus === 'PRESENT' 
          ? 'border-emerald-500/30 bg-emerald-500/5' 
          : isMarked && currentStatus === 'ABSENT' 
          ? 'border-rose-500/30 bg-rose-500/5'
          : isMarked && currentStatus === 'CANCELLED' 
          ? 'border-slate-500/30 bg-slate-800/50'
          : isMarked && currentStatus === 'SWAPPED' 
          ? 'border-sky-500/30 bg-sky-500/5'
          : 'border-white/5 bg-transparent'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Left Side: Time and Subject */}
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
          {/* Time (Compact) */}
          <div className="flex flex-col sm:w-20 shrink-0 mt-0.5 sm:mt-0 text-slate-400">
            <span className="text-xs font-bold text-slate-300">{item.start_time}</span>
            <span className="text-[10px] uppercase font-semibold">{item.end_time}</span>
          </div>

          {/* Subject Badge & Info */}
          <div className="flex items-center gap-3">
            <div 
              className="w-2.5 h-10 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: item.color_hex || '#6366f1' }}
            />
            
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white tracking-tight leading-none">
                  {item.subject_name}
                </h3>
                <span className="px-1.5 py-0.5 rounded-lg text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {item.subject_code}
                </span>
                {item.is_lab && (
                  <span className="px-1.5 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[9px] font-bold">
                    LAB
                  </span>
                )}
                {item.room_number && (
                  <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                    <MapPin className="w-3.5 h-3.5" />
                    {item.room_number}
                  </span>
                )}
              </div>
              
              {/* Stats inline */}
              <div className="flex items-center gap-2 text-[10px]">
                <span className={`font-bold flex items-center gap-1 ${
                  isDanger ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {isDanger ? <AlertTriangle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  <span>{stats.current_percentage}%</span>
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 font-medium">
                  {isDanger ? (
                    <span className="text-rose-400">Attend {stats.classes_to_attend} more</span>
                  ) : (
                    <span>Buffer: <strong className="text-slate-200">{stats.safe_skips}</strong> skip{stats.safe_skips !== 1 ? 's' : ''} left</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Actions (Dense) */}
        <div className="flex items-center justify-end gap-1.5 sm:opacity-50 group-hover:opacity-100 transition-opacity ml-[3.25rem] sm:ml-0">
          {isMarked ? (
            <div className="flex items-center gap-1">
              <div className={`px-2 py-1 rounded-lg font-semibold text-xs flex items-center gap-1 uppercase tracking-wider ${
                currentStatus === 'PRESENT' ? 'bg-emerald-500/20 text-emerald-400' :
                currentStatus === 'ABSENT' ? 'bg-rose-500/20 text-rose-400' :
                currentStatus === 'CANCELLED' ? 'bg-amber-500/20 text-amber-400' :
                'bg-sky-500/20 text-sky-400'
              }`}>
                {currentStatus === 'PRESENT' && <Check className="w-3.5 h-3.5" />}
                {currentStatus === 'ABSENT' && <X className="w-3.5 h-3.5" />}
                {currentStatus === 'CANCELLED' && <Ban className="w-3.5 h-3.5" />}
                {currentStatus === 'SWAPPED' && <ArrowRightLeft className="w-3.5 h-3.5" />}
                <span>{currentStatus}</span>
              </div>
              <button 
                onClick={() => onUndoAttendance(item.slot_id)}
                className="icon-interactive p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-100"
                title="Undo"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                onClick={() => handleTap('PRESENT')}
                className="btn-interactive flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-semibold text-xs flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span className="sm:hidden lg:inline">Present</span>
              </button>
              
              <button
                onClick={() => handleTap('ABSENT')}
                className="btn-interactive flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-semibold text-xs flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span className="sm:hidden lg:inline">Absent</span>
              </button>

              <div className="flex items-center gap-1 border-l border-white/10 pl-1.5">
                <button
                  onClick={() => handleTap('CANCELLED')}
                  className="icon-interactive p-1.5 rounded-xl bg-amber-500/5 hover:bg-amber-500/20 text-amber-400"
                  title="Cancelled"
                >
                  <Ban className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsSwapping(!isSwapping)}
                  className="icon-interactive p-1.5 rounded-xl bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white"
                  title="Swap Class"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inline Swap Sheet */}
      <AnimatePresence>
        {isSwapping && !isMarked && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Select Swapped Class</span>
              <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
                <select
                  value={selectedSwapSubject}
                  onChange={(e) => setSelectedSwapSubject(e.target.value)}
                  className="input-interactive w-full bg-slate-900 px-2 py-1.5 rounded-xl border border-slate-700 text-slate-300 text-xs"
                >
                  {allSubjects.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.subject_code}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleTap('SWAPPED')}
                  className="btn-interactive px-3 py-1.5 rounded-xl bg-sky-600 text-white font-semibold text-xs uppercase shadow-sm"
                >
                  Confirm
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
