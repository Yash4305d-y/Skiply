'use client';

import React from 'react';
import NextLink from 'next/link';
import { Instrument_Serif } from 'next/font/google';
import { ArrowRight } from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import { getCurrentUser } from '@/actions/auth';
import { setDemoModeActive, seedDemoData } from '@/lib/demo-store';

const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  React.useEffect(() => {
    getCurrentUser().then((user) => {
      if (user && user.full_name) {
        setIsLoggedIn(true);
      }
    });
  }, []);

  return (
    <div className="min-h-screen min-h-dvh flex flex-col bg-[#0B0C0E] text-slate-100 overflow-x-hidden w-full">
      {/* Editorial Header */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-start px-6 sm:px-12 md:px-16 max-w-4xl w-full mx-auto pt-16 sm:pt-20 pb-16">
        <div className="flex flex-col items-start text-left w-full">
          {/* Headline: Instrument Serif with deliberate 3-line break & muted/white contrast */}
          <h1 
            className={`${instrumentSerif.className} text-[44px] sm:text-[60px] md:text-[72px] leading-[1.08] tracking-[-0.02em] mb-6 max-w-2xl select-none [text-wrap:balance]`}
          >
            <span className="text-slate-400">
              Know exactly<br />
              when you can<br />
            </span>
            <span className="text-white font-normal">
              safely skip.
            </span>
          </h1>

          {/* Body Copy: max two short lines, left-aligned, muted grey */}
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-lg mb-8">
            Upload your timetable once. Track your classes and know your exact safe skip margins before every lecture.
          </p>

          {/* Actions: Content-width CTA + Secondary text button, no divider */}
          <div className="flex flex-col sm:flex-row sm:items-center items-start gap-4 w-full">
            <NextLink 
              href={isLoggedIn ? "/dashboard" : "/login"} 
              className="w-fit"
            >
              <button 
                type="button"
                className="h-12 px-5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm inline-flex items-center gap-2 transition-colors cursor-pointer select-none"
              >
                <span>Get started</span>
                <ArrowRight strokeWidth={1.75} className="w-4 h-4 text-white" />
              </button>
            </NextLink>

            <NextLink
              href="/dashboard?demo=true"
              onClick={() => {
                setDemoModeActive(true);
                seedDemoData();
              }}
              className="group text-sm font-medium text-slate-400 hover:text-white transition-colors cursor-pointer py-2 inline-flex items-center gap-1.5 select-none"
            >
              <span>Launch demo mode</span>
              <ArrowRight strokeWidth={1.65} className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
            </NextLink>
          </div>

          {/* Readout Component: Example IoT with 75% tick progress bar & safe skips (Desktop only) */}
          <div className="hidden md:block mt-8 w-full max-w-[320px] bg-[#121417] border border-white/[0.06] rounded-lg p-3.5 select-none">
            {/* Header: Label, Subject, Value, and Teal Safe Skips */}
            <div className="flex items-center justify-between text-xs mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Example</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-300 font-medium">IoT</span>
              </div>
              <div className="flex items-center gap-2 tabular-nums">
                <span className="text-white font-semibold text-xs">78%</span>
                <span className="text-teal-400 font-medium text-xs">3 safe skips</span>
              </div>
            </div>

            {/* Progress bar with tick at 75% */}
            <div className="relative w-full h-[4px] bg-white/[0.08] rounded-full overflow-visible">
              {/* Progress fill at 78% */}
              <div 
                className="h-full bg-slate-200 rounded-full" 
                style={{ width: '78%' }} 
              />
              {/* 75% threshold tick mark extending above and below */}
              <div 
                className="absolute -top-[2px] h-[8px] w-[1px] bg-slate-400" 
                style={{ left: '75%' }} 
                title="75% threshold" 
              />
            </div>

            {/* Scale indicators */}
            <div className="flex justify-between items-center mt-1.5 text-[10px] text-slate-500 tabular-nums font-mono">
              <span>0%</span>
              <span className="pl-6">75% min</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
