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
        className="p-2 text-slate-500 rounded-lg bg-[#181B1F] border border-white/[0.06] cursor-not-allowed flex items-center justify-center min-h-[36px] min-w-[36px]"
      >
        <BellOff strokeWidth={1.65} className="w-4 h-4" />
      </button>
    );
  }

  if (permission === 'granted') {
    return (
      <button 
        title="Notifications Enabled"
        disabled
        className="p-2 text-teal-400 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center min-h-[36px] min-w-[36px]"
      >
        <BellRing strokeWidth={1.65} className="w-4 h-4" />
      </button>
    );
  }

  // Default state: not requested yet
  return (
    <button 
      onClick={handleSubscribe}
      disabled={isSubscribing}
      title="Enable Push Notifications"
      className="btn-interactive p-2 text-slate-400 hover:text-white rounded-lg bg-[#181B1F] border border-white/[0.06] flex items-center justify-center min-h-[36px] min-w-[36px] transition-colors"
    >
      <Bell strokeWidth={1.65} className={`w-4 h-4 ${isSubscribing ? 'animate-pulse text-teal-400' : ''}`} />
    </button>
  );
}
