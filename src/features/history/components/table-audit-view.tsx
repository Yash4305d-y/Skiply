import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Edit2, X, Trash2, CalendarIcon } from 'lucide-react';
import { AttendanceLog, Subject, TimetableSlot, AttendanceStatus } from '@/types';

export function TableAuditView({
  filteredLogs,
  subjects,
  slots,
  editingLogId,
  setEditingLogId,
  editStatus,
  setEditStatus,
  onUpdateLog,
  onDeleteLog
}: {
  filteredLogs: AttendanceLog[];
  subjects: Subject[];
  slots: TimetableSlot[];
  editingLogId: string | null;
  setEditingLogId: (id: string | null) => void;
  editStatus: AttendanceStatus;
  setEditStatus: (status: AttendanceStatus) => void;
  onUpdateLog: (id: string, newStatus: AttendanceStatus) => void;
  onDeleteLog: (slotId: string, logDate: string) => void;
}) {
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredLogs.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 73,
    overscan: 5,
  });

  const getStatusBadge = (status: AttendanceStatus) => {
    switch(status) {
      case 'PRESENT': return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20"><CheckCircle2 className="w-3 h-3" /> PRESENT</span>;
      case 'ABSENT': return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold border bg-rose-500/10 text-rose-400 border-rose-500/20"><XCircle className="w-3 h-3" /> ABSENT</span>;
      case 'CANCELLED': return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold border bg-amber-500/10 text-amber-400 border-amber-500/20"><AlertTriangle className="w-3 h-3" /> CANCELLED</span>;
      default: return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold border bg-sky-500/10 text-sky-400 border-sky-500/20"><ShieldCheck className="w-3 h-3" /> SWAPPED</span>;
    }
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
      {filteredLogs.length === 0 ? (
        <div className="p-12 text-center text-slate-400 space-y-2">
          <CalendarIcon className="w-10 h-10 mx-auto opacity-40" />
          <p className="text-sm font-semibold text-slate-400">No matching attendance records found</p>
          <p className="text-xs">Try adjusting your filters or searching for a different keyword.</p>
        </div>
      ) : (
        <div 
          ref={tableContainerRef} 
          className="overflow-auto max-h-[600px] w-full custom-scrollbar relative"
        >
          <div className="min-w-[800px] text-left">
            {/* Fixed Header */}
            <div className="flex items-center bg-slate-900/95 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800 sticky top-0 z-10 backdrop-blur-sm shadow-sm">
              <div className="p-4 font-semibold w-32 shrink-0">Date</div>
              <div className="p-4 font-semibold flex-1 min-w-[200px]">Subject</div>
              <div className="p-4 font-semibold w-48 shrink-0">Time Slot</div>
              <div className="p-4 font-semibold w-56 shrink-0">Status</div>
              <div className="p-4 font-semibold w-32 shrink-0 text-right">Actions</div>
            </div>

            {/* Virtualized Body */}
            <div className="divide-y divide-slate-800/50 text-xs relative" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
              {rowVirtualizer.getVirtualItems().map(virtualRow => {
                const log = filteredLogs[virtualRow.index];
                const sub = subjects.find(s => s.id === log.subject_id);
                const slot = slots.find(sl => sl.id === log.timetable_slot_id);
                const isEditing = editingLogId === log.id;

                return (
                  <div 
                    key={log.id} 
                    className="flex items-center hover:bg-slate-800/40 transition-colors absolute w-full top-0 left-0"
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div className="p-4 font-mono font-medium text-slate-300 w-32 shrink-0">
                      {log.log_date}
                    </div>
                    
                    <div className="p-4 flex-1 min-w-[200px]">
                      {sub ? (
                        <div className="flex items-center gap-2">
                          <span 
                            className="px-2 py-0.5 rounded text-[11px] font-bold text-white shrink-0" 
                            style={{ backgroundColor: sub.color_hex || '#6366f1' }}
                          >
                            {sub.subject_code}
                          </span>
                          <span className="font-semibold text-white truncate">{sub.subject_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unknown Subject</span>
                      )}
                    </div>

                    <div className="p-4 text-slate-400 w-48 shrink-0">
                      {slot ? `${slot.start_time} - ${slot.end_time}` : 'Manual / Custom Slot'}
                    </div>

                    <div className="p-4 w-56 shrink-0">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {(['PRESENT', 'ABSENT', 'CANCELLED', 'SWAPPED'] as AttendanceStatus[]).map(st => (
                            <button
                              key={st}
                              onClick={() => {
                                onUpdateLog(log.id, st);
                                setEditingLogId(null);
                              }}
                              className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                                log.status === st ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      ) : (
                        getStatusBadge(log.status)
                      )}
                    </div>

                    <div className="p-4 w-32 shrink-0 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingLogId(isEditing ? null : log.id)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                        title="Edit record"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remove log for ${sub?.subject_code} on ${log.log_date}?`)) {
                            onDeleteLog(log.timetable_slot_id || '', log.log_date);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                        title="Delete record"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
