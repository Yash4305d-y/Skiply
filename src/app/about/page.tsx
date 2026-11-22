import React from 'react';
import { Metadata } from 'next';
import { Instrument_Serif } from 'next/font/google';
import { 
  Code2, ShieldCheck, Calendar, ExternalLink, 
  CheckCircle2, Sparkles, ArrowRight 
} from 'lucide-react';
import NextLink from 'next/link';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';

const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'About | Skiply — Open-Source Attendance Planner',
  description: 'Learn about Skiply, an open-source attendance safety margin calculator created by Yash Vinay Kalyani and Kyush Kumar.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen min-h-dvh flex flex-col bg-[#0B0C0E] text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 sm:px-8 pt-12 pb-28 sm:pb-32 md:py-16 space-y-12">
        {/* Header Hero */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20">
              Open Source
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono text-slate-300 bg-white/[0.06] border border-white/[0.06]">
              MIT License
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono text-slate-400 bg-white/[0.04]">
              v2.4.2
            </span>
          </div>

          <h1 className={`${instrumentSerif.className} text-4xl sm:text-5xl text-white tracking-[-0.02em] [text-wrap:balance]`}>
            About Skiply
          </h1>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl">
            Skiply is an open-source, client-first attendance safety margin calculator designed for college and university students. Instead of mere tracking, Skiply computes the mathematically verified safe skips remaining across every course and lab before each lecture.
          </p>
        </div>

        {/* Core Principles & Architecture */}
        <section className="space-y-4">
          <h2 className="text-sm font-mono uppercase tracking-wider text-slate-400">
            Architecture & Principles
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-[#121417] border border-white/[0.06] space-y-2">
              <div className="p-2 rounded-lg bg-white/[0.06] text-teal-400 w-fit">
                <Code2 strokeWidth={1.65} className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">100% Open Source</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Licensed under MIT. All mathematical formulas, skip margin models, and timetable parsers are transparent and auditable.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#121417] border border-white/[0.06] space-y-2">
              <div className="p-2 rounded-lg bg-white/[0.06] text-teal-400 w-fit">
                <ShieldCheck strokeWidth={1.65} className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Privacy First</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Zero third-party trackers, zero data harvesting, and zero advertising. All academic schedules can be tested fully locally.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#121417] border border-white/[0.06] space-y-2">
              <div className="p-2 rounded-lg bg-white/[0.06] text-teal-400 w-fit">
                <Calendar strokeWidth={1.65} className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Offline Resilience</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Progressive Web App (PWA) with local sync queue designed to log classes in deep lecture halls without active cellular data.
              </p>
            </div>
          </div>
        </section>

        {/* Creators & Engineering Section */}
        <section className="space-y-4">
          <h2 className="text-sm font-mono uppercase tracking-wider text-slate-400">
            Created By
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Yash Vinay Kalyani */}
            <a
              href="https://yashkalyani.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-4 rounded-xl bg-[#121417] hover:bg-[#181B1F] border border-white/[0.06] hover:border-white/20 transition-all flex flex-col justify-between space-y-4 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 font-bold text-sm flex items-center justify-center shrink-0">
                    YK
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-teal-400 transition-colors">
                      Yash Vinay Kalyani
                    </h3>
                    <p className="text-xs text-slate-400">Co-creator • Engineering & Architecture</p>
                  </div>
                </div>
                <ExternalLink strokeWidth={1.65} className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-colors shrink-0" />
              </div>
              <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-slate-500 group-hover:text-slate-400 transition-colors">
                  yashkalyani.vercel.app
                </span>
                <span className="text-teal-400 text-xs inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Visit Portfolio <ArrowRight strokeWidth={1.65} className="w-3 h-3" />
                </span>
              </div>
            </a>

            {/* Kyush Kumar */}
            <a
              href="https://kyush-portfolio.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-4 rounded-xl bg-[#121417] hover:bg-[#181B1F] border border-white/[0.06] hover:border-white/20 transition-all flex flex-col justify-between space-y-4 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 font-bold text-sm flex items-center justify-center shrink-0">
                    KK
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-teal-400 transition-colors">
                      Kyush Kumar
                    </h3>
                    <p className="text-xs text-slate-400">Co-creator • Product & Development</p>
                  </div>
                </div>
                <ExternalLink strokeWidth={1.65} className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-colors shrink-0" />
              </div>
              <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-slate-500 group-hover:text-slate-400 transition-colors">
                  kyush-portfolio.vercel.app
                </span>
                <span className="text-teal-400 text-xs inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Visit Portfolio <ArrowRight strokeWidth={1.65} className="w-3 h-3" />
                </span>
              </div>
            </a>
          </div>
        </section>

        {/* CTA to App */}
        <div className="p-6 rounded-xl bg-[#121417] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Ready to plan your classes?</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Get started with onboarding or launch instant demo mode.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NextLink
              href="/dashboard"
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs transition-colors"
            >
              Open dashboard
            </NextLink>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
