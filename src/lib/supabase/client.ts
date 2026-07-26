import { createBrowserClient } from '@supabase/ssr';

// Helper to check if valid Supabase cloud credentials are configured
export function hasSupabaseCredentials(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && url.startsWith('http') && key && key.length > 20);
}

// Create Supabase browser client
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';
  return createBrowserClient(url, key);
}
