'use client';

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { m, AnimatePresence } from 'framer-motion';
import { 
  Home, CalendarDays, BarChart2, Plus, 
  CheckCircle2, Calendar, SlidersHorizontal, 
  Download, RotateCcw, Check, Info, ChevronRight, 
  ExternalLink, ShieldCheck, Code2 
} from 'lucide-react';
import { getCurrentUser } from '@/actions/auth';
import { getDailySchedule, markAttendance, getSemesterData } from '@/actions/db';
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
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser().then(user => {
      setIsLoggedIn(Boolean(user && user.full_name));
    });
  }, [pathname]);

  // Close sheet on route navigation
  useEffect(() => {
    setIsActionsOpen(false);
    setIsAboutOpen(false);
  }, [pathname]);

  // Lock background body scroll when either Actions or About sheet is open
  useEffect(() => {
    if (isActionsOpen || isAboutOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalBodyTouchAction = document.body.style.touchAction;
      const originalHtmlOverflow = document.documentElement.style.overflow;

      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      document.documentElement.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.touchAction = originalBodyTouchAction;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [isActionsOpen, isAboutOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // 1. Secondary Action: Quick Mark All Today's Classes Present
  const handleQuickMarkTodayPresent = async () => {
    try {
      const now = new Date();
      const currentDay = now.getDay();
      const todayIso = now.toISOString().split('T')[0];
      const res = await getDailySchedule(currentDay, todayIso);
      const slots = res?.slots || [];
      const unmarked = slots.filter((s: any) => !s.currentStatus);

      if (slots.length === 0) {
        showToast('No classes scheduled for today');
        setIsActionsOpen(false);
        return;
      }

      if (unmarked.length === 0) {
        showToast('All classes for today are already marked');
        setIsActionsOpen(false);
        return;
      }

      for (const slot of unmarked) {
        await markAttendance({
          subjectId: slot.subject_id,
          timetableSlotId: slot.id,
          logDate: todayIso,
          status: 'PRESENT',
        });
      }

      showToast(`Marked ${unmarked.length} class${unmarked.length > 1 ? 'es' : ''} present`);
      setIsActionsOpen(false);
    } catch {
      showToast('Could not mark attendance');
      setIsActionsOpen(false);
    }
  };

  // 2. Secondary Action: Jump to Today on Dashboard
  const handleJumpToToday = () => {
    setIsActionsOpen(false);
    router.push('/dashboard');
  };

  // 3. Secondary Action: Export Timetable to .ics Calendar
  const handleExportIcs = async () => {
    try {
      const data = await getSemesterData();
      const slots = data?.slots || [];
      const subjects = data?.subjects || [];
      if (slots.length === 0) {
        showToast('No timetable found to export');
        setIsActionsOpen(false);
        return;
      }
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
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#181B1F] border border-white/[0.12] text-white text-xs px-4 py-2 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.08)] flex items-center gap-2 select-none pointer-events-none"
          >
            <Check strokeWidth={1.75} className="w-3.5 h-3.5 text-teal-400" />
            <span>{toastMessage}</span>
          </m.div>
        )}
      </AnimatePresence>

      {/* Secondary Actions Bottom Sheet Backdrop with Multiply Blending */}
      <AnimatePresence>
        {isActionsOpen && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setIsActionsOpen(false)}
            onTouchMove={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="md:hidden fixed inset-0 bg-[#0B0C0E]/80 mix-blend-multiply z-40 backdrop-blur-[2px] touch-none"
          />
        )}
      </AnimatePresence>

      {/* Secondary Actions Spring Sheet with Dark Mode Depth & 85dvh Max Height */}
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
            data-sheet="actions"
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
            }}
            className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-[#121417] border-t border-white/[0.10] rounded-t-2xl pb-[calc(1.25rem+env(safe-area-inset-bottom,0.5rem))] px-4 pt-3 max-w-md mx-auto max-h-[85dvh] overflow-y-auto overscroll-contain touch-pan-y shadow-[0_-16px_48px_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(255,255,255,0.08)]"
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
                <Plus strokeWidth={1.65} className="w-4 h-4 rotate-45" />
              </button>
            </div>

            {/* Secondary Action Items with Matched Icon Weights & Dark Mode Depth */}
            <div className="space-y-1.5">
              {/* Quick Mark All Present */}
              <m.button
                type="button"
                whileTap={isLowEnd ? undefined : { scaleX: 1.02, scaleY: 0.94 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                onClick={handleQuickMarkTodayPresent}
                className="w-full p-3 rounded-xl bg-[#181B1F] hover:bg-[#1E2228] border border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.03)] flex items-center gap-3 text-left transition-colors cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 shrink-0">
                  <CheckCircle2 strokeWidth={1.65} className="w-4 h-4" />
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
                className="w-full p-3 rounded-xl bg-[#181B1F] hover:bg-[#1E2228] border border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.03)] flex items-center gap-3 text-left transition-colors cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-white/[0.06] text-slate-300 shrink-0">
                  <Calendar strokeWidth={1.65} className="w-4 h-4" />
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
                className="w-full p-3 rounded-xl bg-[#181B1F] hover:bg-[#1E2228] border border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.03)] flex items-center gap-3 text-left transition-colors cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-white/[0.06] text-slate-300 shrink-0">
                  <SlidersHorizontal strokeWidth={1.65} className="w-4 h-4" />
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
                className="w-full p-3 rounded-xl bg-[#181B1F] hover:bg-[#1E2228] border border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.03)] flex items-center gap-3 text-left transition-colors cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-white/[0.06] text-slate-300 shrink-0">
                  <Download strokeWidth={1.65} className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white">Export calendar (.ics)</p>
                  <p className="text-[11px] text-slate-400">Sync with Apple Calendar, Google, or Outlook</p>
                </div>
              </m.button>

              {/* About Skiply Action */}
              <m.button
                type="button"
                whileTap={isLowEnd ? undefined : { scaleX: 1.02, scaleY: 0.94 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                onClick={() => {
                  setIsActionsOpen(false);
                  setIsAboutOpen(true);
                }}
                className="w-full p-3 rounded-xl bg-[#181B1F] hover:bg-[#1E2228] border border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.03)] flex items-center gap-3 text-left transition-colors cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 shrink-0">
                  <Info strokeWidth={1.65} className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-white">About</p>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-300 font-mono">v2.4.2</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Open source, architecture & creators</p>
                </div>
                <ChevronRight strokeWidth={1.65} className="w-4 h-4 text-slate-500 shrink-0" />
              </m.button>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Mobile About Skiply Bottom Sheet Modal */}
      <AnimatePresence>
        {isAboutOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center" data-sheet="about">
            {/* Backdrop with Multiply Blending */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setIsAboutOpen(false)}
              onTouchMove={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="fixed inset-0 bg-[#0B0C0E]/85 mix-blend-multiply backdrop-blur-[2px] z-40 touch-none"
              aria-hidden="true"
            />

            {/* Floating Bottom Sheet */}
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
              data-sheet="about-content"
              style={{
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
              }}
              className="relative w-full max-w-md mx-auto z-50 bg-[#121417] border-t border-white/[0.10] rounded-t-2xl pb-[calc(1.5rem+env(safe-area-inset-bottom,0.5rem))] px-5 pt-3 max-h-[85dvh] overflow-y-auto overscroll-contain touch-pan-y shadow-[0_-16px_48px_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(255,255,255,0.08)]"
            >
              {/* Grabber Handle */}
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-3" />

              {/* Top Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
                <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">About</span>
                <button
                  type="button"
                  onClick={() => setIsAboutOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                  aria-label="Close about sheet"
                >
                  <Plus strokeWidth={1.65} className="w-4 h-4 rotate-45" />
                </button>
              </div>

              {/* Brand Hero Card */}
              <div className="text-center pb-4 mb-4 border-b border-white/[0.06]">
                {/* Logo Mark Tile */}
                <div className="w-12 h-12 rounded-xl bg-[#181B1F] border border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)] flex items-center justify-center mx-auto mb-2.5">
                  <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 14C12 10.6863 14.6863 8 18 8H30C33.3137 8 36 10.6863 36 14V17C36 19.2091 34.2091 21 32 21H18C15.7909 21 14 22.7909 14 25V34C14 37.3137 16.6863 40 20 40H32C35.3137 40 38 37.3137 38 34V31" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="16" y1="32" x2="32" y2="16" stroke="white" strokeWidth="2.4" strokeLinecap="round" opacity="0.4" />
                    <circle cx="36" cy="12" r="3.5" fill="#2DD4BF" />
                  </svg>
                </div>

                <h2 className="text-xl font-bold text-white tracking-tight">Skiply</h2>
                
                <div className="flex items-center justify-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    Open Source
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-300 bg-white/[0.06] border border-white/[0.06]">
                    MIT License
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-400 bg-white/[0.04]">
                    v2.4.2
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mt-2.5 max-w-xs mx-auto">
                  Intelligent attendance safety margin calculator. Converts complex lecture criteria into single-tap logging and mathematically verified safe skips.
                </p>
              </div>

              {/* Professional Architecture Highlights */}
              <div className="space-y-2 mb-4">
                <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 px-0.5">Architecture & Principles</p>
                
                <div className="bg-[#181B1F] border border-white/[0.06] rounded-xl divide-y divide-white/[0.06] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                  {/* Open Source */}
                  <div className="p-3 flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-white/[0.06] text-slate-300 shrink-0 mt-0.5">
                      <Code2 strokeWidth={1.65} className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white">Free & Open Source</p>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        Community-governed under MIT license. 100% transparent deterministic calculations with zero paywalls.
                      </p>
                    </div>
                  </div>

                  {/* Offline-First */}
                  <div className="p-3 flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-white/[0.06] text-slate-300 shrink-0 mt-0.5">
                      <ShieldCheck strokeWidth={1.65} className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white">Privacy & Offline Resilience</p>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        Engineered for low-connectivity lecture halls. Zero student tracking, zero third-party ads, and client-side encryption.
                      </p>
                    </div>
                  </div>

                  {/* Calendar Integration */}
                  <div className="p-3 flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-white/[0.06] text-slate-300 shrink-0 mt-0.5">
                      <Calendar strokeWidth={1.65} className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white">Universal Schedule Sync</p>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        RFC 5545 `.ics` export support for seamless integration with Apple Calendar, Google Calendar, and Outlook.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Creators & Engineering Section */}
              <div className="space-y-2 mb-4">
                <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 px-0.5">Created By</p>
                
                <div className="space-y-2">
                  {/* Yash Vinay Kalyani */}
                  <a
                    href="https://yashkalyani.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-3 rounded-xl bg-[#181B1F] hover:bg-[#1E2228] border border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.03)] flex items-center justify-between gap-3 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 font-bold text-xs flex items-center justify-center shrink-0">
                        YK
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-white group-hover:text-teal-400 transition-colors">
                            Yash Vinay Kalyani
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-400">Co-creator • Engineering & Architecture</p>
                        <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400 transition-colors">
                          yashkalyani.vercel.app
                        </span>
                      </div>
                    </div>
                    <ExternalLink strokeWidth={1.65} className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-colors shrink-0" />
                  </a>

                  {/* Kyush Kumar */}
                  <a
                    href="https://kyush-portfolio.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-3 rounded-xl bg-[#181B1F] hover:bg-[#1E2228] border border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.03)] flex items-center justify-between gap-3 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 font-bold text-xs flex items-center justify-center shrink-0">
                        KK
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-white group-hover:text-teal-400 transition-colors">
                            Kyush Kumar
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-400">Co-creator • Product & Development</p>
                        <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400 transition-colors">
                          kyush-portfolio.vercel.app
                        </span>
                      </div>
                    </div>
                    <ExternalLink strokeWidth={1.65} className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-colors shrink-0" />
                  </a>
                </div>
              </div>

              {/* Done / Dismiss Button */}
              <button
                type="button"
                onClick={() => setIsAboutOpen(false)}
                className="w-full h-11 rounded-xl bg-[#181B1F] hover:bg-[#1E2228] border border-white/[0.08] text-white text-xs font-medium transition-colors cursor-pointer flex items-center justify-center mt-2"
              >
                Done
              </button>
            </m.div>
          </div>
        )}
      </AnimatePresence>

      {/* Primary Fixed Bottom Navigation Bar with Dark Mode Depth */}
      <nav 
        aria-label="Mobile navigation" 
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0B0C0E]/98 border-t border-white/[0.08] shadow-[0_-4px_24px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.06)] select-none"
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
                  if (isProtected && !isLoggedIn) {
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
                      strokeWidth={isActive ? 1.8 : 1.65}
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
