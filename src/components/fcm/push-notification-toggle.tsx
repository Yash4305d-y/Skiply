'use client';

import React, { useEffect, useState } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { requestFirebaseNotificationPermission, onMessageListener } from '@/lib/firebase';
import { createClient } from '@/lib/supabase/client';

export default function PushNotificationToggle({ userId }: { userId: string }) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (permission === 'granted') {
      const listen = async () => {
        const payload = await onMessageListener();
        if (payload) {
          console.log('[PushNotificationToggle] Foreground message:', payload);
          // Optional: Show an in-app toast for foreground messages
        }
      };
      listen();
    }
  }, [permission]);

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      const token = await requestFirebaseNotificationPermission();
      if (token) {
        setPermission('granted');
        
        // Save token to Supabase
        const supabase = createClient();
        const { error } = await supabase
          .from('fcm_tokens')
          .upsert({ user_id: userId, token }, { onConflict: 'user_id, token' });
          
        if (error) {
          console.error('Failed to save FCM token:', error);
        } else {
          console.log('FCM token saved successfully.');
        }
      } else {
        setPermission(Notification.permission);
      }
    } catch (err) {
      console.error('Subscription error:', err);
    } finally {
      setIsSubscribing(false);
    }
  };

  if (permission === 'denied') {
    return (
      <button 
        title="Notifications Blocked"
        disabled
        className="p-2 text-slate-500 rounded-xl bg-slate-900/30 border border-transparent cursor-not-allowed flex items-center justify-center min-h-[44px] min-w-[44px]"
      >
        <BellOff className="w-5 h-5" />
      </button>
    );
  }

  if (permission === 'granted') {
    return (
      <button 
        title="Notifications Enabled"
        disabled
        className="p-2 text-emerald-400 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center min-h-[44px] min-w-[44px]"
      >
        <BellRing className="w-5 h-5" />
      </button>
    );
  }

  // Default state: not requested yet
  return (
    <button 
      onClick={handleSubscribe}
      disabled={isSubscribing}
      title="Enable Push Notifications"
      className="btn-interactive p-2 text-slate-300 hover:text-white rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center min-h-[44px] min-w-[44px] transition-colors"
    >
      <Bell className={`w-5 h-5 ${isSubscribing ? 'animate-pulse' : ''}`} />
    </button>
  );
}
