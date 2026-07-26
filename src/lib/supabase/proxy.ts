import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase cloud credentials are not configured, skip auth checks
  // so the application can run in offline Demo/Guest mode seamlessly.
  if (!url || !url.startsWith('http') || !key || key.length <= 20) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Do not run code between createServerClient and supabase.auth.getUser().
  // A simple mistake could make it very hard to debug issues with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Allow explicit demo mode via query param or cookie
  const isDemo = request.nextUrl.searchParams.get('demo') === 'true' || request.cookies.get('demo_mode')?.value === 'true';
  if (request.nextUrl.searchParams.get('demo') === 'true') {
    supabaseResponse.cookies.set('demo_mode', 'true', { path: '/', maxAge: 60 * 60 * 24 });
  }

  // Redirect unauthenticated users away from protected routes back to /login
  if (!user && !isDemo && (pathname.startsWith('/dashboard') || pathname.startsWith('/calendar'))) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect_to', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages to /dashboard
  if (user && (pathname === '/login' || pathname === '/register' || pathname === '/signup')) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/dashboard';
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}
