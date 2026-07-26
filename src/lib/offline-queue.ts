// ==============================================================================
// SKIPLY (ATTENDRA) — OFFLINE SYNCHRONIZATION QUEUE (PWA)
// ==============================================================================
// Queues attendance mark/delete actions when offline and automatically syncs
// when network connectivity is restored.

import { AttendanceLog, AttendanceStatus } from '@/types';
import { hasSupabaseCredentials, createClient } from './supabase/client';

const QUEUE_KEY = 'skiply_offline_queue_v1';

export interface QueuedAction {
  id: string;
  type: 'UPSERT_LOG' | 'DELETE_LOG';
  payload: any;
  timestamp: number;
}

export function getOfflineQueue(): QueuedAction[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(QUEUE_KEY);
  if (!saved) return [];
  try { return JSON.parse(saved); } catch { return []; }
}

export function saveOfflineQueue(queue: QueuedAction[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueueAction(action: Omit<QueuedAction, 'id' | 'timestamp'>): void {
  const queue = getOfflineQueue();
  const newAction: QueuedAction = {
    ...action,
    id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
  };
  queue.push(newAction);
  saveOfflineQueue(queue);

  // Attempt sync immediately in case we are online
  if (typeof window !== 'undefined' && navigator.onLine) {
    processOfflineQueue();
  }
}

export async function processOfflineQueue(): Promise<{ synced: number; failed: number }> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  // If Supabase is not configured, local demo store is the system of record,
  // so we simply clear the queue as actions are already locally saved.
  if (!hasSupabaseCredentials()) {
    saveOfflineQueue([]);
    return { synced: queue.length, failed: 0 };
  }

  const supabase = createClient();
  let synced = 0;
  let failed = 0;
  const remainingQueue: QueuedAction[] = [];

  for (const action of queue) {
    try {
      if (action.type === 'UPSERT_LOG') {
        const log: AttendanceLog = action.payload;
        const { error } = await supabase.from('attendance_logs').upsert({
          user_id: log.user_id,
          subject_id: log.subject_id,
          timetable_slot_id: log.timetable_slot_id,
          log_date: log.log_date,
          status: log.status,
          swapped_subject_id: log.swapped_subject_id || null,
        }, {
          onConflict: 'user_id, subject_id, timetable_slot_id, log_date'
        });
        if (error) throw error;
        synced++;
      } else if (action.type === 'DELETE_LOG') {
        const { slotId, dateStr, userId } = action.payload;
        const { error } = await supabase.from('attendance_logs')
          .delete()
          .match({ timetable_slot_id: slotId, log_date: dateStr, user_id: userId });
        if (error) throw error;
        synced++;
      }
    } catch (err) {
      console.error('Failed to sync queued offline action:', err);
      remainingQueue.push(action);
      failed++;
    }
  }

  saveOfflineQueue(remainingQueue);
  return { synced, failed };
}

// Initialize online event listener for background synchronization
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🌐 Network restored. Processing Skiply offline queue...');
    processOfflineQueue();
  });
}
