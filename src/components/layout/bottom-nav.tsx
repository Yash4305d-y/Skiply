'use client';

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { m, AnimatePresence } from 'framer-motion';
import { 
  Home, CalendarDays, BarChart2, Plus, 
  CheckCircle2, Calendar, SlidersHorizontal, 
  Download, RotateCcw, Check 
} from 'lucide-react';
import { getCurrentUser } from '@/actions/auth';
import { 
  isDemoModeActive, getDemoSubjects, getDemoTimetableSlots, 
  saveDemoAttendanceLog, resetDemoData 
} from '@/lib/demo-store';
import { usePerformanceTier } from '@/lib/utils/use-performance-tier';

// Hick's Law: 3 primary daily destinations + 1 dedicated action trigger
const PRIMARY_NAV_TABS = [
  { id: 'home', name: 'Home', href: '/', icon: Home },
  { id: 'dashboard', name: 'Schedule', href: '/dashboard', icon: CalendarDays },
  { id: 'history', name: 'Audit', href: '/history', icon: BarChart2 },
];

const PROTECTED_PATHS = ['/dashboard', '/history', '/onboarding'];
const HIDDEN_ON_PATHS = ['/login'];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLowEnd } = usePerformanceTier();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Close sheet on route navigation
  useEffect(() => {
    setIsActionsOpen(false);
  }, [pathname]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // 1. Secondary Action: Quick Mark All Today's Classes Present
  const handleQuickMarkTodayPresent = () => {
    try {
      const now = new Date();
      const currentDay = now.getDay(); // 0 is Sun, 1 is Mon...
      const todayIso = now.toISOString().split('T')[0];
      const slots = getDemoTimetableSlots().filter(s => s.day_of_week === currentDay);

      if (slots.length === 0) {
        showToast('No classes scheduled for today');
        setIsActionsOpen(false);
        return;
      }

      slots.forEach(slot => {
        saveDemoAttendanceLog({
          id: `demo-log-${Date.now()}-${slot.id}`,
          user_id: 'demo-user-id-1234',
          subject_id: slot.subject_id,
          timetable_slot_id: slot.id,
          log_date: todayIso,
          status: 'PRESENT',
        });
      });

      showToast(`Marked ${slots.length} classes present for today`);
      setIsActionsOpen(false);
    } catch {
      showToast('Attendance logged');
      setIsActionsOpen(false);
    }
  };

  // 2. Secondary Action: Jump to Today on Dashboard
  const handleJumpToToday = () => {
    setIsActionsOpen(false);
    router.push('/dashboard');
  };

  // 3. Secondary Action: Export Timetable to .ics Calendar
  const handleExportIcs = () => {
    try {
      const slots = getDemoTimetableSlots();
      const subjects = getDemoSubjects();
      const subMap = new Map(subjects.map(s => [s.id, s]));

      let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Skiply//Attendance Planner//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
      ];

      const dayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

      slots.forEach(slot => {
        const sub = subMap.get(slot.subject_id);
        const title = sub ? `${sub.subject_code} - ${sub.subject_name}` : 'Class';
        const dayCode = dayNames[slot.day_of_week] || 'MO';
        const startFormatted = (slot.start_time || '09:00').replace(':', '') + '00';
        const endFormatted = (slot.end_time || '10:00').replace(':', '') + '00';

        icsContent.push(
          'BEGIN:VEVENT',
          `SUMMARY:${title}`,
          `LOCATION:${slot.room_number || 'Classroom'}`,
          `RRULE:FREQ=WEEKLY;BYDAY=${dayCode}`,
          `DTSTART:20261101T${startFormatted}`,
          `DTEND:20261101T${endFormatted}`,
          `DESCRIPTION:Skiply scheduled lecture for ${title}`,
          'STATUS:CONFIRMED',
          'END:VEVENT'
        );
      });

      icsContent.push('END:VCALENDAR');
      const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'skiply-timetable.ics');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast('Timetable .ics exported successfully');
      setIsActionsOpen(false);
    } catch {
      showToast('Failed to export calendar');
      setIsActionsOpen(false);
    }
  };

  // 4. Secondary Action: Reset Demo Data
  const handleResetDemo = () => {
    resetDemoData();
    showToast('Demo data reset to fresh state');
    setIsActionsOpen(false);
  };

  // Hide bottom nav on specific fullscreen flows (like login)
  if (HIDDEN_ON_PATHS.includes(pathname)) {
    return null;
  }

  return (
    <>
      {/* Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#181B1F] border border-white/[0.12] text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2 select-none pointer-events-none"
          >
            <Check className="w-3.5 h-3.5 text-teal-400" />
            <span>{toastMessage}</span>
          </m.div>
        )}
      </AnimatePresence>

      {/* Secondary Actions Bottom Sheet Backdrop */}
      <AnimatePresence>
        {isActionsOpen && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setIsActionsOpen(false)}
            className="md:hidden fixed inset-0 bg-black/75 z-40"
          />
        )}
      </AnimatePresence>

      {/* Secondary Actions Spring Sheet */}
      <AnimatePresence>
        {isActionsOpen && (
          <m.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={
              isLowEnd
                ? { duration: 0 }
                : {
                    type: 'spring',
                    stiffness: 380,
                    damping: 34,
                    mass: 0.85,
                  }
            }
            className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-[#121417] border-t border-white/[0.08] rounded-t-2xl pb-[calc(1rem+env(safe-area-inset-bottom,0.5rem))] px-4 pt-3 max-w-md mx-auto select-none"
          >
            {/* Grabber Handle */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Quick actions</h3>
                <p className="text-[11px] text-slate-400">Contextual shortcuts and tools</p>
              </div>
              <button
                type="button"
                onClick={() => setIsActionsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                aria-label="Close actions"
              >
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>

            {/* Secondary Action Items with Squash and Squeeze tap feedback */}
            <div className="space-y-1.5">
              {/* Quick Mark All Present */}
              <m.button
                type="button"
                whileTap={isLowEnd ? undefined : { scaleX: 1.02, scaleY: 0.94 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                onClick={handleQuickMarkTodayPresent}
                className="w-full p-3 rounded-xl bg-[#181B1F] hover:bg-[#1E2228] border border-white/[0.06] flex items-center gap-3 text-left transition-colors cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white">Mark today present</p>
                  <p className="text-[11px] text-slate-400">Log all scheduled classes today as present</p>
                </div>
              </m.button>

              {/* Jump to Today */}
              <m.button
                type="button"
                whileTap={isLowEnd ? undefined : { scaleX: 1.02, scaleY: 0.94 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                onClick={handleJumpToToday}
                className="w-full p-3 rounded-xl bg-[#181B1F] hover:bg-[#1E2228] border border-white/[0.06] flex items-center gap-3 text-left transition-colors cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-white/[0.06] text-slate-300 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white">Jump to today</p>
                  <p className="text-[11px] text-slate-400">Open schedule focused on today's classes</p>
                </div>
              </m.button>

              {/* Timetable Setup */}
              <m.button
                type="button"
                whileTap={isLowEnd ? undefined : { scaleX: 1.02, scaleY: 0.94 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                onClick={() => {
                  setIsActionsOpen(false);
                  router.push('/onboarding');
                }}
                className="w-full p-3 rounded-xl bg-[#181B1F] hover:bg-[#1E2228] border border-white/[0.06] flex items-center gap-3 text-left transition-colors cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-white/[0.06] text-slate-300 shrink-0">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white">Semester setup & targets</p>
                  <p className="text-[11px] text-slate-400">Update semester dates, target %, or timetable</p>
                </div>
              </m.button>

              {/* Export Timetable */}
              <m.button
                type="button"
                whileTap={isLowEnd ? undefined : { scaleX: 1.02, scaleY: 0.94 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                onClick={handleExportIcs}
                className="w-full p-3 rounded-xl bg-[#181B1F] hover:bg-[#1E2228] border border-white/[0.06] flex items-center gap-3 text-left transition-colors cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-white/[0.06] text-slate-300 shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white">Export calendar (.ics)</p>
                  <p className="text-[11px] text-slate-400">Sync with Apple Calendar, Google, or Outlook</p>
                </div>
              </m.button>

              {/* Reset Demo Data (If in demo mode) */}
              {isDemo && (
                <m.button
                  type="button"
                  whileTap={isLowEnd ? undefined : { scaleX: 1.02, scaleY: 0.94 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  onClick={handleResetDemo}
                  className="w-full p-3 rounded-xl bg-[#181B1F] hover:bg-[#1E2228] border border-white/[0.06] flex items-center gap-3 text-left transition-colors cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white">Reset demo data</p>
                    <p className="text-[11px] text-slate-400">Restore default demo semester and sample logs</p>
                  </div>
                </m.button>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Primary Fixed Bottom Navigation Bar */}
      <nav 
        aria-label="Mobile navigation" 
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0B0C0E] border-t border-white/[0.08] select-none"
        style={{
          paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))',
        }}
      >
        <div className="max-w-md mx-auto px-3 pt-1 flex items-center justify-around h-14">
          {/* Primary Nav Destinations (Hick's Law: 3 focused primary destinations) */}
          {PRIMARY_NAV_TABS.map((tab) => {
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
                className="relative py-1 px-2.5 rounded-xl flex flex-col items-center justify-center flex-1 max-w-[80px] group outline-none"
              >
                {/* Squash & Squeeze tactile feedback on tap */}
                <m.div
                  whileTap={
                    isLowEnd 
                      ? undefined 
                      : { scaleX: 1.15, scaleY: 0.82, y: 1 }
                  }
                  transition={{ 
                    type: 'spring', 
                    stiffness: 480, 
                    damping: 18, 
                    mass: 0.6 
                  }}
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

                  {/* Active status indicator: expands from a dot into a wide pill when arriving */}
                  <span className="h-1 flex items-center justify-center">
                    {isActive && (
                      <m.span
                        layoutId="bottomNavPip"
                        initial={isLowEnd ? false : { width: 6, scaleX: 0.4, opacity: 0.8 }}
                        animate={isLowEnd ? undefined : { width: 18, scaleX: 1, opacity: 1 }}
                        exit={{ width: 6, scaleX: 0.4, opacity: 0 }}
                        className="h-1 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]"
                        transition={
                          isLowEnd
                            ? { duration: 0 }
                            : {
                                type: 'spring',
                                stiffness: 420,
                                damping: 24,
                                mass: 0.6,
                              }
                        }
                      />
                    )}
                  </span>
                </m.div>
              </NextLink>
            );
          })}

          {/* Secondary Action Trigger Button with Squash & Squeeze */}
          <button
            type="button"
            onClick={() => setIsActionsOpen(prev => !prev)}
            aria-label="Quick actions"
            className="relative py-1 px-2.5 rounded-xl flex flex-col items-center justify-center flex-1 max-w-[80px] group outline-none cursor-pointer"
          >
            <m.div
              whileTap={
                isLowEnd 
                  ? undefined 
                  : { scaleX: 1.18, scaleY: 0.80, y: 1 }
              }
              transition={{ 
                type: 'spring', 
                stiffness: 500, 
                damping: 16, 
                mass: 0.6 
              }}
              className="relative flex flex-col items-center gap-0.5 w-full py-1"
            >
              {/* Highlight background when action sheet is open */}
              {isActionsOpen && (
                <m.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 bg-white/[0.08] border border-white/[0.1] rounded-xl -z-10"
                />
              )}

              {/* Action Plus Icon with 45deg Morph Transition */}
              <m.div
                animate={{ rotate: isActionsOpen ? 45 : 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                className="w-6 h-6 rounded-full bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400"
              >
                <Plus strokeWidth={2} className="w-3.5 h-3.5" />
              </m.div>

              {/* Action Label */}
              <span 
                className={`text-[10px] leading-tight tracking-tight transition-colors duration-200 ${
                  isActionsOpen ? 'text-teal-400 font-semibold' : 'text-slate-400 group-hover:text-slate-200 font-medium'
                }`}
              >
                Actions
              </span>

              {/* Reserved height to maintain uniform baseline */}
              <span className="h-1" />
            </m.div>
          </button>
        </div>
      </nav>
    </>
  );
}
