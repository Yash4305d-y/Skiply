'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Ban, RefreshCw, MapPin, Clock, AlertTriangle, ShieldCheck, ArrowRightLeft, Sparkles } from 'lucide-react';
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
  const isSafe = stats.status === 'SAFE';

  // Handle tap action
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
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={`glass-card rounded-2xl p-5 sm:p-6 transition-all border ${
        isMarked && currentStatus === 'PRESENT' 
          ? 'border-emerald-500 bg-gradient-to-r from-emerald-950/30 to-slate-900 shadow-lg shadow-emerald-500/10' 
          : isMarked && currentStatus === 'ABSENT' 
          ? 'border-rose-500 bg-gradient-to-r from-rose-950/30 to-slate-900 shadow-lg shadow-rose-500/10'
          : isMarked && currentStatus === 'CANCELLED' 
          ? 'border-slate-400 bg-gradient-to-r from-slate-900 to-slate-800/80 shadow-lg shadow-slate-500/10'
          : isMarked && currentStatus === 'SWAPPED' 
          ? 'border-sky-500 bg-gradient-to-r from-sky-950/30 to-slate-900 shadow-lg shadow-sky-500/10'
          : 'border-slate-800/80 hover:border-teal-500/40'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Info: Subject Code, Title, Room & Time */}
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span 
              className="px-2.5 py-0.5 rounded-lg text-xs font-black text-white shadow-sm"
              style={{ backgroundColor: item.color_hex || '#6366f1' }}
            >
              {item.subject_code}
            </span>

            {item.is_lab && (
              <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold uppercase tracking-wider">
                🧪 Lab Block
              </span>
            )}

            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium ml-auto sm:ml-2">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>{item.start_time} - {item.end_time}</span>
              {item.room_number && (
                <>
                  <span className="text-slate-600">•</span>
                  <MapPin className="w-3.5 h-3.5 text-teal-400" />
                  <span>{item.room_number}</span>
                </>
              )}
            </div>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {item.subject_name}
          </h3>

          {/* Subject Stats & Safe Skips Badge */}
          <div className="flex items-center gap-3 pt-1 text-xs">
            <span className={`font-bold flex items-center gap-1 ${
              isDanger ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {isDanger ? <AlertTriangle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>{stats.current_percentage}% Attended</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300 font-medium">
              {isDanger ? (
                <span className="text-rose-400 font-bold">⚠️ Must attend {stats.classes_to_attend} more class(es)</span>
              ) : (
                <span>Buffer: <strong className="text-white font-bold">{stats.safe_skips}</strong> safe skip{stats.safe_skips !== 1 ? 's' : ''} left</span>
              )}
            </span>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex flex-col sm:items-end gap-2">
          {isMarked ? (
            /* Marked State with Undo Option */
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 p-1.5 rounded-2xl"
            >
              <div className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 ${
                currentStatus === 'PRESENT' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' :
                currentStatus === 'ABSENT' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' :
                currentStatus === 'CANCELLED' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' :
                'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
              }`}>
                {currentStatus === 'PRESENT' && <Check className="w-4 h-4" />}
                {currentStatus === 'ABSENT' && <X className="w-4 h-4" />}
                {currentStatus === 'CANCELLED' && <Ban className="w-4 h-4" />}
                {currentStatus === 'SWAPPED' && <ArrowRightLeft className="w-4 h-4" />}
                <span>Marked {currentStatus}</span>
              </div>

              <button 
                onClick={() => onUndoAttendance(item.slot_id)}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Undo / Change Status"
                aria-label="Undo attendance"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            /* Unmarked Action Buttons */
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* PRESENT BUTTON */}
              <button
                onClick={() => handleTap('PRESENT')}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 hover:border-emerald-500 text-emerald-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm hover:shadow-lg hover:shadow-emerald-600/25 active:scale-95 group"
              >
                <Check className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Present</span>
              </button>

              {/* ABSENT BUTTON */}
              <button
                onClick={() => handleTap('ABSENT')}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 hover:border-rose-500 text-rose-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm hover:shadow-lg hover:shadow-rose-600/25 active:scale-95 group"
              >
                <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Absent</span>
              </button>

              {/* CANCELLED BUTTON */}
              <button
                onClick={() => handleTap('CANCELLED')}
                className="flex-1 sm:flex-initial px-3 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600 border border-amber-500/30 hover:border-amber-500 text-amber-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-sm hover:shadow-lg hover:shadow-amber-600/25 active:scale-95 group"
                title="Class cancelled by professor (does not affect %)"
              >
                <Ban className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Cancelled</span>
              </button>

              {/* SWAP / OVERRIDE TRIGGER */}
              <button
                onClick={() => setIsSwapping(!isSwapping)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all"
                title="Swap Subject / Proxy Lecture"
                aria-label="Swap Subject"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Inline Swap Subject Modal / Sheet */}
      <AnimatePresence>
        {isSwapping && !isMarked && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden border-t border-slate-800 pt-4"
          >
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                <ArrowRightLeft className="w-4 h-4 text-teal-400" />
                <span>Swapped Class / Proxy Lecture:</span>
              </div>

              <div className="flex items-center gap-2 flex-1 sm:max-w-md">
                <select
                  value={selectedSwapSubject}
                  onChange={(e) => setSelectedSwapSubject(e.target.value)}
                  className="w-full bg-slate-950 px-3 py-2 rounded-xl border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
                >
                  {allSubjects.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.subject_code} — {sub.subject_name} {sub.id === item.subject_id ? '(Current)' : ''}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => handleTap('SWAPPED')}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs whitespace-nowrap shadow-md shadow-sky-600/25 transition-all"
                >
                  Confirm Swap
                </button>

                <button
                  onClick={() => setIsSwapping(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
