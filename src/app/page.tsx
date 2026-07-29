'use client';

import React from 'react';
import NextLink from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck, Zap, UploadCloud, Calendar, Clock, ArrowRight, CheckCircle2, Flame, Smartphone } from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import AmbientBackground from '@/components/layout/ambient-background';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-transparent text-slate-100 selection:bg-teal-500/30 selection:text-white overflow-x-hidden w-full relative">
      <AmbientBackground />
      <Navbar />

      <main className="flex-1 relative z-10">
        {/* HERO SECTION */}
        <section className="relative pt-16 pb-20 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          {/* Hero Soft Reflection */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-teal-400/5 blur-[100px] rounded-full pointer-events-none -z-10" />

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative z-10 space-y-6 max-w-4xl mx-auto"
          >
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/50 border border-white/5 text-slate-300 text-xs sm:text-sm font-semibold">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Attendra AI — The Intelligent College Attendance Planner</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1]">
              How many classes can you <span className="text-teal-400">safely skip</span> without ruining your attendance?
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
              Stop manually calculating attendance percentages or creating Excel spreadsheets. Upload your class timetable and academic calendar once — Vision AI sets up your entire semester automatically.
            </p>

            {/* CTA Buttons */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <NextLink
                href="/dashboard"
                className="btn-interactive w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-50 text-slate-950 font-bold text-sm flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-teal-600 text-teal-600" />
                <span>Try Interactive Demo Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </NextLink>

              <NextLink
                href="/onboarding"
                className="btn-interactive w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-800 text-white font-bold text-sm border border-slate-700 flex items-center justify-center gap-2"
              >
                <UploadCloud className="w-4 h-4 text-teal-400" />
                <span>Start AI Schedule Setup</span>
              </NextLink>
            </div>

            {/* Trust Badges */}
            <div className="pt-10 flex flex-wrap items-center justify-center gap-6 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> 100% Deterministic Math</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> Vision AI OCR Parser</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> Works Offline (PWA)</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> Zero Login Required</span>
            </div>
          </motion.div>
        </section>

        {/* FEATURE CARDS GRID */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
          {/* Features Soft Reflection */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-sky-400/5 blur-[120px] rounded-full pointer-events-none -z-10" />

          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Built Specifically for University Life
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Everything you need to maintain your required 75% threshold while keeping your academic sanity intact.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="glass-card card-interactive premium-gradient-border p-8 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-teal-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">60-Second AI Setup</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Just snap a photo of your college notice board or timetable PDF. Gemini Vision OCR extracts course codes, titles, lab blocks, and exam holidays automatically.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card card-interactive premium-gradient-border p-8 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Exact Safe Skip Calculator</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Our deterministic math engine calculates the precise number of lectures you can skip per subject, factoring in remaining semester days and upcoming academic holidays.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card card-interactive premium-gradient-border p-8 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-rose-400">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Danger Zone Recovery</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                If your attendance drops below your target threshold, Skiply calculates exactly how many consecutive lectures you must attend to get back in the green.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass-card card-interactive premium-gradient-border p-8 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-sky-400">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Single-Tap Daily Tracking</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                No complex submenus. Every morning, tap Present, Absent, or Cancelled for your scheduled classes in less than 3 seconds. Easily swap classes for proxy lectures.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="glass-card card-interactive premium-gradient-border p-8 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Works Offline in Lecture Halls</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Basement lecture hall with no cellular signal? No problem. Skiply works as an offline Progressive Web App with local storage and background synchronization.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="glass-card card-interactive premium-gradient-border p-8 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Full Semester Audit History</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Maintain a verifiable log of every class attended across the entire semester. Filter by course or date, and edit logs anytime if you made a mistake.
              </p>
            </div>
          </div>
        </section>

        {/* BOTTOM BANNER CTA */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto relative z-10">
          {/* CTA Soft Reflection */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[80%] bg-teal-400/10 blur-[100px] rounded-full pointer-events-none -z-10" />

          <div className="glass-card premium-gradient-border rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Ready to take control of your attendance?
              </h2>
              <p className="text-slate-400 text-sm sm:text-base">
                Try our pre-loaded college schedule right now in Demo Mode, or upload your own timetable in under a minute.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
                <NextLink
                  href="/dashboard"
                  className="btn-interactive px-8 py-3.5 rounded-xl bg-slate-50 text-slate-950 font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 fill-teal-600 text-teal-600" />
                  <span>Launch Demo Dashboard</span>
                </NextLink>
                <NextLink
                  href="/onboarding"
                  className="btn-interactive px-8 py-3.5 rounded-xl bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 border border-slate-700"
                >
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span>AI Timetable Upload</span>
                </NextLink>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

