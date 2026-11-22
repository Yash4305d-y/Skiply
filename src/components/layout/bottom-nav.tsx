'use client';

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { m } from 'framer-motion';
import { Home, CalendarDays, BarChart2, SlidersHorizontal } from 'lucide-react';
import { getCurrentUser } from '@/actions/auth';
import { isDemoModeActive } from '@/lib/demo-store';
import { usePerformanceTier } from '@/lib/utils/use-performance-tier';

const NAV_TABS = [
  { id: 'home', name: 'Home', href: '/', icon: Home },
  { id: 'dashboard', name: 'Schedule', href: '/dashboard', icon: CalendarDays },
  { id: 'history', name: 'Audit', href: '/history', icon: BarChart2 },
  { id: 'onboarding', name: 'Setup', href: '/onboarding', icon: SlidersHorizontal },
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
                whileTap={isLowEnd ? undefined : { scale: 0.92 }}
                transition={{ duration: 0.12, ease: [0.2, 0, 0, 1] }}
                className="relative flex flex-col items-center gap-0.5 w-full py-1"
              >
                {/* Active Sliding Indicator Pill with Fluid Spring Physics */}
                {isActive && (
                  <m.div
                    layoutId="bottomNavPill"
                    className="absolute inset-0 bg-white/[0.06] border border-white/[0.08] rounded-xl -z-10 shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                    transition={
                      isLowEnd
                        ? { duration: 0 }
                        : {
                            type: 'spring',
                            stiffness: 360,
                            damping: 32,
                            mass: 0.85,
                          }
                    }
                  />
                )}

                {/* Tab Icon with Subtle Active Spring Elevation */}
                <m.div
                  animate={
                    isLowEnd
                      ? undefined
                      : {
                          scale: isActive ? 1.08 : 1,
                          y: isActive ? -1 : 0,
                        }
                  }
                  transition={{
                    type: 'spring',
                    stiffness: 380,
                    damping: 26,
                  }}
                  className="flex items-center justify-center"
                >
                  <Icon 
                    strokeWidth={isActive ? 1.8 : 1.5}
                    className={`w-[18px] h-[18px] transition-colors duration-200 ${
                      isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`} 
                  />
                </m.div>

                {/* Tab Label */}
                <span 
                  className={`text-[10px] leading-tight tracking-tight transition-colors duration-200 ${
                    isActive ? 'text-white font-semibold' : 'text-slate-400 group-hover:text-slate-200 font-medium'
                  }`}
                >
                  {tab.name}
                </span>

                {/* Subtle active status pip with reserved height to keep tabs perfectly level */}
                <span className="h-1 flex items-center justify-center">
                  {isActive && (
                    <m.span
                      layoutId="bottomNavPip"
                      className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_6px_rgba(45,212,191,0.5)]"
                      transition={
                        isLowEnd
                          ? { duration: 0 }
                          : {
                              type: 'spring',
                              stiffness: 380,
                              damping: 30,
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
