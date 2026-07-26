'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History as HistoryIcon, Search, Filter, Trash2, Edit2, Check, X, Ban, ArrowRightLeft, Calendar, ShieldCheck, AlertTriangle } from 'lucide-react';
import { AttendanceLog, Subject, TimetableSlot, AttendanceStatus } from '@/types';

interface HistoryViewProps {
  logs: AttendanceLog[];
  subjects: Subject[];
  slots: TimetableSlot[];
  onUpdateLog: (logId: string, newStatus: AttendanceStatus) => void;
  onDeleteLog: (slotId: string, dateStr: string) => void;
}

export default function HistoryView({ logs, subjects, slots, onUpdateLog, onDeleteLog }: HistoryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  // Sort logs by date descending (most recent first)
  const sortedLogs = [...logs].sort((a, b) => b.log_date.localeCompare(a.log_date));

  // Filter logs
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
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold"><ArrowRightLeft className="w-3.5 h-3.5" /> Swapped</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <HistoryIcon className="w-6 h-6 text-indigo-400" />
            <span>Attendance Audit History</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review all recorded lectures across the semester. Edit or remove logs to correct accidental marks.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
          <span>Total Recorded Logs:</span>
          <strong className="text-white font-bold">{logs.length}</strong>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="glass-card p-4 rounded-2xl border-slate-800 flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text"
            placeholder="Search by subject code, title, or date (YYYY-MM-DD)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/90 pl-9 pr-4 py-2 rounded-xl border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Subject Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select 
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Subjects ({subjects.length})</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.subject_code} — {s.subject_name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">Present Only</option>
            <option value="ABSENT">Absent Only</option>
            <option value="CANCELLED">Cancelled Only</option>
            <option value="SWAPPED">Swapped Only</option>
          </select>
        </div>
      </div>

      {/* Logs Table / Cards List */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Calendar className="w-10 h-10 mx-auto opacity-40" />
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
                                  log.status === st ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
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
    </div>
  );
}
