import { NextResponse } from 'next/server';
import { adminMessaging } from '@/lib/firebase-admin';
import { createClient } from '@supabase/supabase-js';

// We need a server-side Supabase client with Service Role to bypass RLS and read any user's tokens
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    if (!adminMessaging) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    // In a real app, you should authenticate the caller (e.g., checking authorization header)
    // For this example, we assume internal/trusted caller.
    const body = await request.json();
    const { userId, title, body: notificationBody, url } = body;

    if (!userId || !title || !notificationBody) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch tokens for the user from Supabase
    const { data: tokens, error } = await supabase
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching FCM tokens:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ success: true, message: 'No tokens found for user' });
    }

    const tokenStrings = tokens.map(t => t.token);

    const message = {
      notification: {
        title,
        body: notificationBody,
      },
      data: {
        url: url || '/dashboard',
      },
      tokens: tokenStrings,
    };

    // Send the notification
    const response = await adminMessaging.sendEachForMulticast(message);

    // Clean up invalid tokens
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
          .in('token', failedTokens)
          .eq('user_id', userId); // For safety
        console.log(`Cleaned up ${failedTokens.length} invalid tokens.`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      successCount: response.successCount, 
      failureCount: response.failureCount 
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
