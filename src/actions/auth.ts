'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// Helper to convert username or student ID into internal virtual email
export async function getVirtualEmail(username: string): Promise<string> {
  const sanitized = username.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
  return `${sanitized}.skiply.app@gmail.com`;
}

export async function signUpWithUniqueId(arg1: unknown, arg2?: FormData) {
  const formData = arg2 instanceof FormData ? arg2 : (arg1 instanceof FormData ? arg1 : new FormData());
  const supabase = await createClient();
  
  const usernameRaw = (formData.get('username') || formData.get('uniqueId') || formData.get('studentId')) as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  
  if (!usernameRaw || !password || !fullName) {
    return { error: 'All fields (Username / Student ID, Full Name, and Password) are required.' };
  }

  const sanitizedId = usernameRaw.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
  if (!sanitizedId) {
    return { error: 'Please enter a valid alphanumeric Username / Student ID (e.g., alex_2026 or 2026cse01).' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  const virtualEmail = await getVirtualEmail(sanitizedId);

  const { error } = await supabase.auth.signUp({
    email: virtualEmail,
    password: password,
    options: {
      data: {
        username: sanitizedId,
        full_name: fullName.trim(),
        password: password,
        semester_start_date: formData.get('startDate'),
        semester_end_date: formData.get('endDate'),
      },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('exists')) {
      return { error: 'This Username / Student ID is already registered. Please switch to the Login tab or try another username.' };
    }
    return { error: error.message };
  }

  const redirectTo = (formData.get('redirectTo') as string) || '/dashboard';
  redirect(redirectTo);
}

export async function signInWithUniqueId(arg1: unknown, arg2?: FormData) {
  const formData = arg2 instanceof FormData ? arg2 : (arg1 instanceof FormData ? arg1 : new FormData());
  const supabase = await createClient();
  
  const usernameRaw = (formData.get('username') || formData.get('uniqueId') || formData.get('studentId')) as string;
  const password = formData.get('password') as string;
  
  if (!usernameRaw || !password) {
    return { error: 'Please enter your Username / Student ID and password.' };
  }

  const sanitizedId = usernameRaw.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
  const virtualEmail = await getVirtualEmail(sanitizedId);

  const { error } = await supabase.auth.signInWithPassword({
    email: virtualEmail,
    password: password,
  });

  if (error) {
    return { error: 'Invalid Username / Student ID or password. Please verify your credentials and try again.' };
  }

  const redirectTo = (formData.get('redirectTo') as string) || '/dashboard';
  redirect(redirectTo);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    
    // Try to fetch profile from profiles table or auth metadata
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profile) {
      return {
        id: user.id,
        unique_id: profile.username || user.user_metadata?.username,
        full_name: profile.full_name || user.user_metadata?.full_name || 'Student',
        email: user.email,
      };
    }
    return {
      id: user.id,
      unique_id: user.user_metadata?.username || user.email?.split('@')[0],
      full_name: user.user_metadata?.full_name || 'Student',
      email: user.email,
    };
  } catch {
    return null;
  }
}
