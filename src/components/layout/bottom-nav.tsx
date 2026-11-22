'use client';

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { m } from 'framer-motion';
import { Home, LayoutDashboard, History, Sparkles } from 'lucide-react';
import { getCurrentUser } from '@/actions/auth';
import { isDemoModeActive } from '@/lib/demo-store';
import { usePerformanceTier } from '@/lib/utils/use-performance-tier';

const NAV_TABS = [
  { id: 'home', name: 'Home', href: '/', icon: Home },
  { id: 'dashboard', name: 'Schedule', href: '/dashboard', icon: LayoutDashboard },
  { id: 'history', name: 'Audit', href: '/history', icon: History },
  { id: 'onboarding', name: 'Setup', href: '/onboarding', icon: Sparkles },
];

const PROTECTED_PATHS = ['/dashboard', '/history', '/onboarding'];
const HIDDEN_ON_PATHS = ['/login'];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLowEnd } = usePerformanceTier();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    setIsDemo(isDemoModeActive());
    const handleDemo = () => setIsDemo(isDemoModeActive());
    window.addEventListener('skiply_demo_state_changed', handleDemo);
    return () => window.removeEventListener('skiply_demo_state_changed', handleDemo);
  }, []);

  useEffect(() => {
    getCurrentUser().then(user => {
      setIsLoggedIn(Boolean(user && user.full_name));
    });
  }, [pathname]);

  // Hide bottom nav on specific fullscreen flows (like login)
  if (HIDDEN_ON_PATHS.includes(pathname)) {
    return null;
  }

  return (
    <nav 
      aria-label="Mobile navigation" 
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0B0C0E] border-t border-white/[0.08] select-none"
      style={{
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))',
      }}
    >
      <div className="max-w-md mx-auto px-3 pt-1 flex items-center justify-around h-14">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.href === '/' 
            ? pathname === '/' 
            : pathname.startsWith(tab.href);
          const isProtected = PROTECTED_PATHS.includes(tab.href);

          return (
            <NextLink
              key={tab.id}
              href={tab.href}
              onClick={(e) => {
                if (isProtected && !isLoggedIn && !isDemo) {
                  e.preventDefault();
                  router.push(`/login?redirect=${encodeURIComponent(tab.href)}`);
                }
              }}
              className="relative py-1 px-2.5 rounded-xl flex flex-col items-center justify-center flex-1 max-w-[84px] group outline-none"
            >
              <m.div
                whileTap={isLowEnd ? undefined : { scale: 0.90 }}
                transition={{ duration: 0.12, ease: [0.2, 0, 0, 1] }}
                className="relative flex flex-col items-center gap-0.5 w-full py-1"
              >
                {/* Active Sliding Indicator Pill with Spring Physics */}
                {isActive && (
                  <m.div
                    layoutId="bottomNavPill"
                    className="absolute inset-0 bg-white/[0.06] border border-white/[0.08] rounded-xl -z-10"
                    transition={
                      isLowEnd
                        ? { duration: 0 }
                        : {
                            type: 'spring',
                            stiffness: 420,
                            damping: 30,
                            mass: 0.8,
                          }
                    }
                  />
                )}

                {/* Tab Icon */}
                <Icon 
                  className={`w-4 h-4 transition-colors duration-150 ${
                    isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`} 
                />

                {/* Tab Label */}
                <span 
                  className={`text-[10px] leading-tight transition-colors duration-150 ${
                    isActive ? 'text-white font-semibold' : 'text-slate-400 group-hover:text-slate-200 font-medium'
                  }`}
                >
                  {tab.name}
                </span>

                {/* Subtle active status pip with reserved height to keep tabs level */}
                <span className="h-1 flex items-center justify-center">
                  {isActive && (
                    <m.span
                      layoutId="bottomNavPip"
                      className="w-1 h-1 rounded-full bg-teal-400"
                      transition={
                        isLowEnd
                          ? { duration: 0 }
                          : {
                              type: 'spring',
                              stiffness: 450,
                              damping: 32,
                            }
                      }
                    />
                  )}
                </span>
              </m.div>
            </NextLink>
          );
        })}
      </div>
    </nav>
  );
}
