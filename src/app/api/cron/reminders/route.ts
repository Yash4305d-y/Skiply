import { NextResponse } from 'next/server';
import { adminMessaging } from '@/lib/firebase-admin';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  // 1. Verify Vercel Cron Secret
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!adminMessaging) {
    return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
  }

  // 2. Time Calculations (IST: Asia/Kolkata)
  const now = new Date();
  const istDateString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const istDate = new Date(istDateString);

  const hour = istDate.getHours();
  const dayOfWeek = istDate.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
  
  // Format YYYY-MM-DD in IST
  const y = istDate.getFullYear();
  const m = String(istDate.getMonth() + 1).padStart(2, '0');
  const d = String(istDate.getDate()).padStart(2, '0');
  const currentDateStr = `${y}-${m}-${d}`;

  // 3. Prevent weekend runs
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return NextResponse.json({ skipped: true, reason: 'Weekend' });
  }

  // 4. Determine Notification Content
  let title = '';
  let body = '';

  if (hour === 18) {
    title = 'Attendance Reminder';
    body = "🔔 You haven't marked today's attendance yet. Don't forget before the day ends.";
  } else if (hour === 20) {
    title = 'Attendance Reminder';
    body = "⏰ Your attendance is still pending. Please mark it before the day ends.";
  } else if (hour === 22) {
    title = 'Final Reminder';
    body = "⚠️ This is your final reminder. Today's attendance is still pending.";
  } else {
    // If cron triggered at an unexpected hour, skip it.
    return NextResponse.json({ skipped: true, reason: 'Not a reminder hour', hour });
  }

  try {
    // 5. Fetch all users with valid tokens and reminders enabled
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, reminders_enabled');
      
    if (profileError) throw profileError;

    const { data: fcmTokens, error: tokenError } = await supabase
      .from('fcm_tokens')
      .select('user_id, token');

    if (tokenError) throw tokenError;

    // 6. Fetch today's schedule to see who has classes
    const { data: slots, error: slotsError } = await supabase
      .from('timetable_slots')
      .select('user_id')
      .eq('day_of_week', dayOfWeek);
      
    if (slotsError) throw slotsError;
    const usersWithClassesToday = new Set(slots.map(s => s.user_id));

    // 7. Fetch today's attendance logs
    const { data: logs, error: logsError } = await supabase
      .from('attendance_logs')
      .select('user_id')
      .eq('log_date', currentDateStr);
      
    if (logsError) throw logsError;
    const usersWithAttendanceMarked = new Set(logs.map(l => l.user_id));

    // 8. Filter Users
    // Must have reminders enabled (or null which defaults to true), MUST have classes today, MUST NOT have marked attendance
    const targetUserIds = profiles
      .filter(p => p.reminders_enabled !== false)
      .map(p => p.id)
      .filter(id => usersWithClassesToday.has(id) && !usersWithAttendanceMarked.has(id));

    if (targetUserIds.length === 0) {
      return NextResponse.json({ success: true, sent: 0, reason: 'No users pending attendance' });
    }

    // 9. Collect Tokens
    const targetTokensData = fcmTokens.filter(t => targetUserIds.includes(t.user_id));
    const tokenStrings = targetTokensData.map(t => t.token);

    if (tokenStrings.length === 0) {
      return NextResponse.json({ success: true, sent: 0, reason: 'No tokens found for target users' });
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: {
        url: '/dashboard',
      },
      tokens: tokenStrings,
    };

    // 10. Send multi-cast
    const response = await adminMessaging.sendEachForMulticast(message);

    // 11. Clean up invalid tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp: any, idx: number) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          if (
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/registration-token-not-registered'
          ) {
            failedTokens.push(tokenStrings[idx]);
          }
        }
      });

      if (failedTokens.length > 0) {
        await supabase
          .from('fcm_tokens')
          .delete()
          .in('token', failedTokens);
        console.log(`[Cron] Cleaned up ${failedTokens.length} invalid tokens.`);
      }
    }

    return NextResponse.json({
      success: true,
      sentCount: response.successCount,
      failureCount: response.failureCount,
      hour,
      date: currentDateStr
    });
  } catch (error) {
    console.error('Error executing cron:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
