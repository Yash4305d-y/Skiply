'use client';

import { useEffect } from 'react';
import { TimetableSlot, AttendanceLog } from '@/types';

interface AttendanceReminderProps {
  slots: TimetableSlot[];
  logs: AttendanceLog[];
}

export default function AttendanceReminder({ slots, logs }: AttendanceReminderProps) {
  useEffect(() => {
    // 1. Request permission silently on first user gesture on the dashboard
    const requestPermission = () => {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    };
    
    // Attach it to body clicks so any interaction triggers it naturally
    document.addEventListener('click', requestPermission, { once: true });
    
    return () => document.removeEventListener('click', requestPermission);
  }, []);

  useEffect(() => {
    const timeoutIds: NodeJS.Timeout[] = [];

    const handleReminders = async () => {
      if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;
      if (!('serviceWorker' in navigator)) return;
      
      const reg = await navigator.serviceWorker.ready;
      if (!reg) return;

      const getAttendanceNotifications = async () => {
        const notifications = await reg.getNotifications();
        return notifications.filter(n => n.tag.startsWith('attendance-reminder'));
      };

      // Check if attendance is required today
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const dayOfWeek = today.getDay();
      const todaySlots = slots.filter(s => s.day_of_week === dayOfWeek);
      
      if (todaySlots.length === 0) {
        // No classes today, clear any scheduled reminders
        const notifications = await getAttendanceNotifications();
        notifications.forEach(n => n.close());
        return;
      }
      
      const todayLogs = logs.filter(l => l.log_date === todayStr);
      // If at least one class is marked, assume they've checked their attendance for the day
      const hasMarkedAtLeastOne = todayLogs.length > 0;
      
      if (hasMarkedAtLeastOne) {
        // Attendance marked, cancel all reminders for today
        const notifications = await getAttendanceNotifications();
        notifications.forEach(n => n.close());
      } else {
        // Schedule up to 3 reminders for today: 7:00 PM, 9:30 PM, 11:00 PM
        const reminderTimes = [
           { hours: 19, minutes: 0, id: '1' },
           { hours: 21, minutes: 30, id: '2' },
           { hours: 23, minutes: 0, id: '3' }
        ];
        
        const now = new Date();

        reminderTimes.forEach(async ({ hours, minutes, id }) => {
           const targetTime = new Date();
           targetTime.setHours(hours, minutes, 0, 0);
           
           const tag = `attendance-reminder-${id}`;
           
           if (targetTime.getTime() > now.getTime()) {
              if ('showTrigger' in Notification.prototype) {
                 try {
                   await reg.showNotification('Attendance Reminder', {
                     body: "You haven't marked today's attendance yet. Mark it now before the attendance window closes.",
                     icon: '/icon-192.png',
                     tag: tag,
                     data: { url: '/dashboard' },
                     // @ts-expect-error TimestampTrigger is an experimental API
                     showTrigger: new (window as unknown as { TimestampTrigger: new (time: number) => unknown }).TimestampTrigger(targetTime.getTime())
                   });
                 } catch (e) {
                   console.log('TimestampTrigger not supported or failed', e);
                 }
              } else {
                 // Fallback for browsers without Notification Triggers API
                 const delay = targetTime.getTime() - new Date().getTime();
                 const tid = setTimeout(() => {
                    if (Notification.permission === 'granted') {
                       reg.showNotification('Attendance Reminder', {
                         body: "You haven't marked today's attendance yet. Mark it now before the attendance window closes.",
                         icon: '/icon-192.png',
                         tag: tag,
                         data: { url: '/dashboard' }
                       });
                    }
                 }, delay);
                 timeoutIds.push(tid);
              }
           }
        });
      }
    };
    
    handleReminders();

    return () => {
      // Clean up timeouts if the component unmounts or dependencies change
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, [slots, logs]);

  return null;
}
