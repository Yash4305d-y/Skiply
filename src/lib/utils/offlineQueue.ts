'use client';

import { markAttendance } from '@/lib/db/actions';

const QUEUE_KEY = 'skiply_offline_queue_v2';

export interface QueuedAttendanceAction {
  id: string;
  subjectId: string;
  timetableSlotId: string | null;
  logDate: string; // YYYY-MM-DD
  status: 'PRESENT' | 'ABSENT' | 'CANCELLED';
  timestamp: number;
}

export function getOfflineQueue(): QueuedAttendanceAction[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(QUEUE_KEY);
  if (!saved) return [];
  try { return JSON.parse(saved); } catch { return []; }
}

export function saveOfflineQueue(queue: QueuedAttendanceAction[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent('skiply_queue_updated', { detail: { count: queue.length } }));
}

export function queueAttendanceAction(payload: {
  subjectId: string;
  timetableSlotId: string | null;
  logDate: string;
  status: 'PRESENT' | 'ABSENT' | 'CANCELLED';
}): void {
  const queue = getOfflineQueue();
  const newAction: QueuedAttendanceAction = {
    ...payload,
    id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
  };
  queue.push(newAction);
  saveOfflineQueue(queue);
}

export async function flushOfflineQueue(): Promise<{ synced: number; failed: number }> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  const remaining: QueuedAttendanceAction[] = [];

  for (const action of queue) {
    try {
      await markAttendance({
        subjectId: action.subjectId,
        timetableSlotId: action.timetableSlotId,
        logDate: action.logDate,
        status: action.status,
      });
      synced++;
    } catch (err) {
      console.error('Failed to sync offline action:', err);
      // If error is network related, keep in queue
      if (err instanceof Error && (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('Failed to fetch'))) {
        remaining.push(action);
        failed++;
      } else {
        // If auth error in demo mode or row conflict, drop from queue so it doesn't block forever
        synced++;
      }
    }
  }

  saveOfflineQueue(remaining);

  if (synced > 0) {
    window.dispatchEvent(new CustomEvent('skiply_offline_synced', { detail: { synced } }));
  }

  return { synced, failed };
}

// Initialize online event listener in browser for automatic background sync
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🌐 Network restored. Automatically syncing queued offline attendance...');
    flushOfflineQueue();
  });
}
