'use client';

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { m, AnimatePresence } from 'framer-motion';
import { CalendarDays, BarChart2, SlidersHorizontal, LogOut, LogIn } from 'lucide-react';
import { getCurrentUser, signOut } from '@/actions/auth';
import { usePerformanceTier } from '@/lib/utils/use-performance-tier';
import PushNotificationToggle from '@/components/fcm/push-notification-toggle';

const PROTECTED_PATHS = ['/dashboard', '/history', '/onboarding'];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLowEnd } = usePerformanceTier();
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user && user.full_name) {
        setUserName(`${user.full_name.split(' ')[0]} (${user.unique_id})`);
        setUserId(user.id);
        setIsLoggedIn(true);
      } else {
        setUserId(null);
        setIsLoggedIn(false);
        setUserName('');
      }
    });
  }, [pathname]);

  const navItems = [
    { name: 'Schedule', href: '/dashboard', icon: CalendarDays },
    { name: 'Attendance audit', href: '/history', icon: BarChart2 },
    { name: 'Setup', href: '/onboarding', icon: SlidersHorizontal },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0B0C0E] border-b border-white/[0.06] w-full">
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Wordmark */}
        <div className="flex items-center gap-6">
          <NextLink href="/" className="text-xl font-bold tracking-tight text-white hover:text-slate-200 transition-colors">
            Skiply
          </NextLink>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <NextLink
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'text-white bg-white/[0.06]' : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  {item.name}
                </NextLink>
              );
            })}
          </nav>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Desktop User Info & Auth */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">{userName}</span>
                {userId && <PushNotificationToggle userId={userId} />}
                <button
                  onClick={() => signOut()}
                  className="text-xs text-slate-400 hover:text-rose-400 transition-colors p-1"
                  title="Sign out"
                >
                  <LogOut strokeWidth={1.65} className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <NextLink
                href="/login"
                className="text-xs font-medium text-slate-400 hover:text-white transition-colors px-2 py-1"
              >
                Sign in
              </NextLink>
            )}
          </div>

          {/* Mobile Menu Button: Text "Menu" */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-sm font-medium text-slate-300 hover:text-white px-2 py-1 transition-colors cursor-pointer select-none"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>

      {/* Nav Drawer: Fully Opaque Solid Panel + Plain Scrim */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="md:hidden">
            {/* Plain Scrim */}
            <m.div
              initial={isLowEnd ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={isLowEnd ? undefined : { opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 z-40"
              aria-hidden="true"
            />

            {/* Fully Opaque Solid Panel (#0B0C0E) */}
            <m.div
              initial={isLowEnd ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={isLowEnd ? undefined : { opacity: 0, y: -8 }}
              transition={isLowEnd ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
              className="fixed top-16 inset-x-0 bottom-0 bg-[#0B0C0E] z-50 flex flex-col justify-between p-6 border-t border-white/[0.06] overflow-y-auto"
            >
              {/* Large Nav Items, Generous Spacing */}
              <div className="flex flex-col gap-6 pt-4">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <NextLink
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`text-xl font-medium transition-colors ${
                        isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {item.name}
                    </NextLink>
                  );
                })}
              </div>

              {/* Bottom Actions: Sign in as text link; Get started as only filled button */}
              <div className="pt-6 border-t border-white/[0.06] flex flex-col gap-4 mt-auto">
                {isLoggedIn ? (
                  <>
                    <div className="text-xs text-slate-500">
                      Signed in as <span className="text-slate-300 font-medium">{userName}</span>
                    </div>
                    <button
                      onClick={() => { signOut(); setIsMobileMenuOpen(false); }}
                      className="text-left py-2 text-sm text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      Sign out
                    </button>
                    <NextLink
                      href="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="h-12 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm flex items-center justify-center transition-colors"
                    >
                      Open dashboard
                    </NextLink>
                  </>
                ) : (
                  <>
                    <NextLink
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-center py-2 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      Sign in
                    </NextLink>
                    <NextLink
                      href="/onboarding"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="h-12 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm flex items-center justify-center transition-colors"
                    >
                      Get started
                    </NextLink>
                  </>
                )}
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
