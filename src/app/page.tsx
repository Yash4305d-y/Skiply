'use client';

import React from 'react';
import NextLink from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck, Zap, UploadCloud, Calendar, Clock, ArrowRight, CheckCircle2, Flame, Smartphone, Heart } from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-teal-500 selection:text-white overflow-hidden">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-20 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          {/* Subtle glowing orbs */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 right-10 w-72 h-72 bg-sky-600/15 rounded-full blur-3xl pointer-events-none hidden md:block" />
          <div className="absolute bottom-10 left-10 w-72 h-72 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none hidden md:block" />

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 space-y-6 max-w-4xl mx-auto"
          >
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-teal-500/10 via-sky-500/10 to-emerald-500/10 border border-teal-500/20 text-teal-300 text-xs sm:text-sm font-bold shadow-lg shadow-teal-500/5">
              <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
              <span>Attendra AI — The Intelligent College Attendance Planner</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1]">
              How many classes can you <span className="gradient-text">safely skip</span> without ruining your attendance?
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
              Stop manually calculating attendance percentages or creating Excel spreadsheets. Upload your class timetable and academic calendar once — Vision AI sets up your entire semester automatically.
            </p>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <NextLink
                href="/dashboard"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-600 via-sky-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white font-extrabold text-base shadow-xl shadow-teal-500/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Zap className="w-5 h-5 fill-white" />
                <span>Try Interactive Demo Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </NextLink>

              <NextLink
                href="/onboarding"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl glass-card hover:bg-slate-800/80 text-white font-bold text-base border border-slate-700/80 flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                <UploadCloud className="w-5 h-5 text-teal-400" />
                <span>Start AI Schedule Setup</span>
              </NextLink>
            </div>

            {/* Trust Badges */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-semibold uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100% Deterministic Math</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-sky-400" /> Vision AI OCR Parser</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Works Offline (PWA)</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-rose-400" /> Zero Login Required</span>
            </div>
          </motion.div>
        </section>

        {/* FEATURE CARDS GRID */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/60 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Built Specifically for University Life
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Everything you need to maintain your required 75% threshold while keeping your academic sanity intact.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: AI Onboarding */}
            <div className="glass-card p-8 rounded-3xl space-y-4 border-teal-500/20 hover:border-teal-500/40 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">60-Second AI Setup</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Just snap a photo of your college notice board or timetable PDF. Gemini Vision OCR extracts course codes, titles, lab blocks, and exam holidays automatically.
              </p>
            </div>

            {/* Feature 2: Safe Skip Math Engine */}
            <div className="glass-card p-8 rounded-3xl space-y-4 border-emerald-500/20 hover:border-emerald-500/40 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Exact Safe Skip Calculator</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Our deterministic math engine calculates the precise number of lectures you can skip per subject, factoring in remaining semester days and upcoming academic holidays.
              </p>
            </div>

            {/* Feature 3: Danger Zone Recovery */}
            <div className="glass-card p-8 rounded-3xl space-y-4 border-rose-500/20 hover:border-rose-500/40 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Danger Zone Recovery</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                If your attendance drops below your target threshold, Skiply calculates exactly how many consecutive lectures you must attend to get back in the green.
              </p>
            </div>

            {/* Feature 4: One-Tap Daily Interaction */}
            <div className="glass-card p-8 rounded-3xl space-y-4 border-sky-500/20 hover:border-sky-500/40 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Single-Tap Daily Tracking</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                No complex submenus. Every morning, tap Present, Absent, or Cancelled for your scheduled classes in less than 3 seconds. Easily swap classes for proxy lectures.
              </p>
            </div>

            {/* Feature 5: Offline PWA */}
            <div className="glass-card p-8 rounded-3xl space-y-4 border-emerald-500/20 hover:border-emerald-500/40 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Works Offline in Lecture Halls</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Basement lecture hall with no cellular signal? No problem. Skiply works as an offline Progressive Web App with local storage and background synchronization.
              </p>
            </div>

            {/* Feature 6: Audit History */}
            <div className="glass-card p-8 rounded-3xl space-y-4 border-amber-500/20 hover:border-amber-500/40 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Full Semester Audit History</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Maintain a verifiable log of every class attended across the entire semester. Filter by course or date, and edit logs anytime if you made a mistake.
              </p>
            </div>
          </div>
        </section>

        {/* BOTTOM BANNER CTA */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="glass-card rounded-3xl p-8 sm:p-12 text-center bg-gradient-to-r from-teal-950/80 via-sky-950/60 to-slate-900 border-teal-500/30 relative overflow-hidden shadow-2xl">
            <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Ready to take control of your attendance?
              </h2>
              <p className="text-slate-300 text-sm sm:text-base">
                Try our pre-loaded college schedule right now in Demo Mode, or upload your own timetable in under a minute.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row justify-center gap-4">
                <NextLink
                  href="/dashboard"
                  className="px-8 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-extrabold text-sm shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 fill-teal-600 text-teal-600" />
                  <span>Launch Demo Dashboard</span>
                </NextLink>
                <NextLink
                  href="/onboarding"
                  className="px-8 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-xl shadow-teal-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
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

