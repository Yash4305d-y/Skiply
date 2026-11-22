import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Check, X, Ban, ArrowRightLeft, Edit2, CalendarIcon } from 'lucide-react';
import { AttendanceLog, Subject, TimetableSlot, AttendanceStatus } from '@/types';

export function TableAuditView({
  filteredLogs,
  subjects,
  slots,
  editingLogId,
  setEditingLogId,
  editStatus: _editStatus,
  setEditStatus: _setEditStatus,
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
    estimateSize: () => 64,
    overscan: 5,
  });

  const getStatusBadge = (status: AttendanceStatus) => {
    switch(status) {
      case 'PRESENT': return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border bg-teal-500/10 text-teal-400 border-teal-500/20"><Check strokeWidth={1.8} className="w-3 h-3" /> Present</span>;
      case 'ABSENT': return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border bg-rose-500/10 text-rose-400 border-rose-500/20"><X strokeWidth={1.8} className="w-3 h-3" /> Absent</span>;
      case 'CANCELLED': return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border bg-white/[0.06] text-slate-400 border-white/10"><Ban strokeWidth={1.65} className="w-3 h-3" /> Cancelled</span>;
      default: return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border bg-white/[0.06] text-slate-300 border-white/10"><ArrowRightLeft strokeWidth={1.65} className="w-3 h-3" /> Swapped</span>;
    }
  };

  return (
    <div className="bg-[#121417] rounded-xl overflow-hidden border border-white/[0.06]">
      {filteredLogs.length === 0 ? (
        <div className="p-8 text-center text-slate-400 space-y-1.5">
          <CalendarIcon strokeWidth={1.65} className="w-5 h-5 mx-auto text-slate-500" />
          <p className="text-sm font-semibold text-slate-200">No matching attendance records</p>
          <p className="text-xs text-slate-400">Try adjusting your filters or search keywords</p>
        </div>
      ) : (
        <div 
          ref={tableContainerRef} 
          className="overflow-auto max-h-[600px] w-full relative"
        >
          <div className="min-w-[800px] text-left">
            {/* Header: Sentence case */}
            <div className="flex items-center bg-[#181B1F] text-slate-400 text-xs border-b border-white/[0.06] sticky top-0 z-10">
              <div className="p-3.5 font-medium w-32 shrink-0">Date</div>
              <div className="p-3.5 font-medium flex-1 min-w-[200px]">Subject</div>
              <div className="p-3.5 font-medium w-44 shrink-0">Time slot</div>
              <div className="p-3.5 font-medium w-48 shrink-0">Status</div>
              <div className="p-3.5 font-medium w-28 shrink-0 text-right">Actions</div>
            </div>

            {/* Virtualized Body */}
            <div className="divide-y divide-white/[0.06] text-xs relative" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
              {rowVirtualizer.getVirtualItems().map(virtualRow => {
                const log = filteredLogs[virtualRow.index];
                const sub = subjects.find(s => s.id === log.subject_id);
                const slot = slots.find(sl => sl.id === log.timetable_slot_id);
                const isEditing = editingLogId === log.id;

                return (
                  <div 
                    key={log.id} 
                    className="flex items-center hover:bg-white/[0.02] transition-colors absolute w-full top-0 left-0"
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div className="p-3.5 font-mono text-slate-300 w-32 shrink-0 tabular-nums">
                      {log.log_date}
                    </div>
                    
                    <div className="p-3.5 flex-1 min-w-[200px]">
                      {sub ? (
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-medium text-slate-300 bg-[#181B1F] border border-white/[0.06] shrink-0">
                            {sub.subject_code}
                          </span>
                          <span className="font-medium text-white truncate">{sub.subject_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Unknown subject</span>
                      )}
                    </div>

                    <div className="p-3.5 text-slate-400 font-mono w-44 shrink-0 tabular-nums">
                      {slot ? `${slot.start_time} – ${slot.end_time}` : 'Manual log'}
                    </div>

                    <div className="p-3.5 w-48 shrink-0">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          {(['PRESENT', 'ABSENT', 'CANCELLED'] as AttendanceStatus[]).map(st => (
                            <button
                              key={st}
                              onClick={() => {
                                onUpdateLog(log.id, st);
                                setEditingLogId(null);
                              }}
                              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                                log.status === st 
                                  ? 'bg-teal-600 text-white' 
                                  : 'bg-[#181B1F] text-slate-400 hover:text-white'
                              }`}
                            >
                              {st === 'PRESENT' ? 'P' : st === 'ABSENT' ? 'A' : 'C'}
                            </button>
                          ))}
                        </div>
                      ) : (
                        getStatusBadge(log.status)
                      )}
                    </div>

                    <div className="p-3.5 w-28 shrink-0 text-right flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingLogId(isEditing ? null : log.id)}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                        title={isEditing ? 'Cancel edit' : 'Edit status'}
                      >
                        <Edit2 strokeWidth={1.65} className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteLog(log.timetable_slot_id || '', log.log_date)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-white/[0.06] transition-colors"
                        title="Delete log"
                      >
                        <X strokeWidth={1.8} className="w-3.5 h-3.5" />
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
