'use client';

import React from 'react';
import NextLink from 'next/link';
import { motion, useScroll, useTransform, useReducedMotion, Variants } from 'framer-motion';
import { Sparkles, ShieldCheck, Zap, UploadCloud, Calendar, Clock, ArrowRight, CheckCircle2, Flame, Smartphone, ChevronDown, LogIn } from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import AmbientBackground from '@/components/layout/ambient-background';
import { getCurrentUser } from '@/actions/auth';
import dynamic from 'next/dynamic';
import { usePerformanceTier } from '@/lib/utils/use-performance-tier';

const DashboardPreview = dynamic(
  () => import('@/features/marketing/components/dashboard-preview').then(mod => mod.DashboardPreview),
  { ssr: false, loading: () => <div className="w-full max-w-5xl mx-auto mt-16 h-[600px] rounded-2xl glass-card animate-pulse" /> }
);

export default function Home() {
  const { scrollYProgress } = useScroll();
  const shouldReduceMotion = useReducedMotion();
  const { isLowEnd } = usePerformanceTier();
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  React.useEffect(() => {
    getCurrentUser().then((user) => {
      if (user && user.full_name) {
        setIsLoggedIn(true);
      }
    });
  }, []);

  // Parallax effects for background elements (disabled on low-end)
  const yHeroAurora = useTransform(scrollYProgress, [0, 1], isLowEnd ? [0, 0] : [0, 250]);
  const yFeaturesAurora = useTransform(scrollYProgress, [0, 1], isLowEnd ? [0, 0] : [0, 300]);
  const yCtaAurora = useTransform(scrollYProgress, [0, 1], isLowEnd ? [0, 0] : [0, 150]);

  // Shared animation variants
  const heroContainerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: isLowEnd ? 0.06 : 0.1,
        delayChildren: isLowEnd ? 0.1 : 0.2,
      }
    }
  };

  const fadeUpVariant: Variants = {
    hidden: { opacity: 0, y: (shouldReduceMotion || isLowEnd) ? 0 : 10 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: isLowEnd ? 0.3 : 0.5, ease: "easeOut" } 
    }
  };

  const featureContainerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      }
    }
  };

  const featureCardVariant: Variants = {
    hidden: { opacity: 0, y: (shouldReduceMotion || isLowEnd) ? 0 : 16 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: isLowEnd ? 0.25 : 0.4, ease: "easeOut" } 
    }
  };

  const sectionRevealVariant: Variants = {
    hidden: { opacity: 0, y: (shouldReduceMotion || isLowEnd) ? 0 : 20 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: isLowEnd ? 0.3 : 0.45, ease: "easeOut" } 
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-slate-100 selection:bg-[#5EEAD4]/30 selection:text-white overflow-x-hidden w-full relative">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-[#5EEAD4] origin-left z-[100] shadow-[0_0_10px_rgba(94,234,212,0.5)]"
        style={{ scaleX: scrollYProgress }}
      />

      <AmbientBackground />
      
      {/* Navbar fades in first */}
      <motion.div
        initial={{ opacity: 0, y: isLowEnd ? 0 : -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: isLowEnd ? 0.2 : 0.4, ease: "easeOut" }}
      >
        <Navbar />
      </motion.div>

      <main className="flex-1 relative z-10">
        {/* HERO SECTION */}
        <section className="relative pt-16 pb-12 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          {/* Hero Soft Reflection with Parallax & Vignette */}
          <motion.div 
            style={{ y: shouldReduceMotion ? 0 : yHeroAurora }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[100%] h-[120%] bg-[radial-gradient(ellipse_at_center,rgba(94,234,212,0.08)_0%,transparent_70%)] rounded-full pointer-events-none -z-10" 
          />

          <motion.div 
            variants={heroContainerVariants}
            initial="hidden"
            animate="show"
            className="relative z-10 space-y-7 max-w-4xl mx-auto flex flex-col items-center"
          >
            {/* Pill Badge */}
            <motion.div 
              variants={fadeUpVariant}
              whileHover={shouldReduceMotion ? {} : { y: -2, scale: 1.02, backgroundColor: "rgba(15, 23, 42, 0.9)" }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-slate-900/60 border border-[#5EEAD4]/20 text-[#5EEAD4] text-[13px] font-semibold shadow-lg shadow-[#5EEAD4]/5 cursor-default"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI-Powered Attendance Intelligence</span>
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={fadeUpVariant} className="text-[40px] sm:text-[56px] md:text-[64px] lg:text-[72px] font-bold tracking-[-0.03em] text-white leading-[1.1] max-w-3xl">
              How many classes can you <span className="text-[#5EEAD4]">safely skip</span> without ruining your attendance?
            </motion.h1>

            {/* Subtitle */}
            <motion.p variants={fadeUpVariant} className="text-[18px] sm:text-[20px] md:text-[24px] text-slate-400 max-w-xl mx-auto font-normal leading-relaxed">
              Stop manually calculating attendance percentages or creating Excel spreadsheets. Upload your class timetable and academic calendar once — Vision AI sets up your entire semester automatically.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={fadeUpVariant} className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
              
              {/* DESKTOP ONLY: Interactive Demo */}
              <NextLink href="/dashboard" className="hidden sm:block outline-none w-full sm:w-auto rounded-xl">
                <motion.div
                  whileHover={shouldReduceMotion ? {} : { y: -2, scale: 1.01, filter: "brightness(1.05)" }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  className="btn-interactive w-full px-8 py-3.5 rounded-xl bg-slate-50 text-slate-950 font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-[#5EEAD4]/10 hover:shadow-[#5EEAD4]/25 group"
                >
                  <Zap className="w-4 h-4 fill-teal-600 text-teal-600" />
                  <span>Interactive Demo</span>
                  <motion.div
                    transition={{ duration: 0.2 }}
                    className="group-hover:translate-x-1"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </motion.div>
              </NextLink>

              {/* MOBILE ONLY: Sign In (Only if not logged in) */}
              {!isLoggedIn && (
                <NextLink href="/login" className="sm:hidden outline-none block w-full rounded-xl">
                  <motion.div
                    whileHover={shouldReduceMotion ? {} : { y: -2, scale: 1.01, filter: "brightness(1.05)" }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    className="btn-interactive w-full px-8 py-3.5 rounded-xl bg-slate-50 text-slate-950 font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-[#5EEAD4]/10 hover:shadow-[#5EEAD4]/25 group"
                  >
                    <LogIn className="w-4 h-4 text-teal-600" />
                    <span>Sign In</span>
                    <motion.div
                      transition={{ duration: 0.2 }}
                      className="group-hover:translate-x-1"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </motion.div>
                  </motion.div>
                </NextLink>
              )}

              <NextLink href="/onboarding" className="outline-none block w-full sm:w-auto rounded-xl">
                <motion.div
                  whileHover={shouldReduceMotion ? {} : { border: "1px solid rgba(94,234,212,0.4)", backgroundColor: "rgba(30,41,59,0.8)" }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  className="btn-interactive w-full px-8 py-3.5 rounded-xl bg-slate-900 text-white font-semibold text-base border border-slate-700 flex items-center justify-center gap-2 hover:bg-slate-800 shadow-md group"
                >
                  <UploadCloud className="w-4 h-4 text-[#5EEAD4] group-hover:scale-110 transition-transform" />
                  <span>Start AI Setup</span>
                </motion.div>
              </NextLink>
            </motion.div>

            {/* Dashboard Preview Component */}
            <motion.div variants={fadeUpVariant} className="pt-16 pb-6 w-full">
              <DashboardPreview />
            </motion.div>

            {/* Trust Bar */}
            <motion.div variants={fadeUpVariant} className="pb-12 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-sm text-slate-400 font-medium">
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#5EEAD4]" /> AI Attendance Prediction</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#5EEAD4]" /> Automatic Timetable Import</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#5EEAD4]" /> Smart Skip Calculator</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#5EEAD4]" /> Semester Analytics</span>
            </motion.div>

            {/* Scroll Cue */}
            <motion.div 
              variants={fadeUpVariant}
              initial={{ y: 0 }}
              animate={isLowEnd ? {} : { y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center justify-center text-slate-400 gap-2 mt-4 opacity-60"
            >
              <span className="text-[9px] uppercase tracking-[0.2em] font-bold">Scroll to explore</span>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </motion.div>
        </section>

        {/* FEATURE CARDS GRID */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10 overflow-visible">
          {/* Features Soft Reflection with Parallax */}
          <motion.div 
            style={{ y: shouldReduceMotion ? 0 : yFeaturesAurora }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-sky-400/5 blur-[120px] rounded-full pointer-events-none -z-10" 
          />

          <motion.div 
            variants={sectionRevealVariant}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center max-w-2xl mx-auto mb-16 space-y-4 relative z-10"
          >
            <h2 className="text-2xl sm:text-[28px] md:text-[32px] font-bold text-white tracking-[-0.02em]">
              Built Specifically for University Life
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Everything you need to maintain your required 75% threshold while keeping your academic sanity intact.
            </p>
          </motion.div>

          <motion.div 
            variants={featureContainerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              {
                icon: Sparkles,
                color: "text-teal-400",
                title: "60-Second AI Setup",
                desc: "Just snap a photo of your college notice board or timetable PDF. Gemini Vision OCR extracts course codes, titles, lab blocks, and exam holidays automatically."
              },
              {
                icon: ShieldCheck,
                color: "text-emerald-400",
                title: "Exact Safe Skip Calculator",
                desc: "Our deterministic math engine calculates the precise number of lectures you can skip per subject, factoring in remaining semester days and upcoming academic holidays."
              },
              {
                icon: Flame,
                color: "text-rose-400",
                title: "Danger Zone Recovery",
                desc: "If your attendance drops below your target threshold, Skiply calculates exactly how many consecutive lectures you must attend to get back in the green."
              },
              {
                icon: Clock,
                color: "text-sky-400",
                title: "Single-Tap Daily Tracking",
                desc: "No complex submenus. Every morning, tap Present, Absent, or Cancelled for your scheduled classes in less than 3 seconds. Easily swap classes for proxy lectures."
              },
              {
                icon: Smartphone,
                color: "text-emerald-400",
                title: "Works Offline in Lecture Halls",
                desc: "Basement lecture hall with no cellular signal? No problem. Skiply works as an offline Progressive Web App with local storage and background synchronization."
              },
              {
                icon: Calendar,
                color: "text-amber-400",
                title: "Full Semester Audit History",
                desc: "Maintain a verifiable log of every class attended across the entire semester. Filter by course or date, and edit logs anytime if you made a mistake."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                variants={featureCardVariant}
              whileHover={isLowEnd ? {} : (shouldReduceMotion ? {} : { y: -4 })}
                whileTap={isLowEnd ? {} : (shouldReduceMotion ? {} : { scale: 0.98 })}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="glass-card card-interactive premium-gradient-border p-8 rounded-2xl space-y-4 group bg-slate-900/40 hover:bg-slate-900/70"
              >
                <motion.div 
                  className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center ${feature.color}`}
                >
                  <feature.icon className="w-5 h-5" />
                </motion.div>
                <h3 className="text-lg font-bold text-slate-100">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* BOTTOM BANNER CTA */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto relative z-10">
          {/* CTA Soft Reflection with Parallax */}
          <motion.div 
            style={{ y: shouldReduceMotion ? 0 : yCtaAurora }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[80%] bg-[#5EEAD4]/10 blur-[120px] rounded-full pointer-events-none -z-10" 
          />

          <motion.div 
            variants={sectionRevealVariant}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="glass-card premium-gradient-border rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden"
          >
            <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-[-0.02em]">
                Ready to take control of your attendance?
              </h2>
              <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
                Try our pre-loaded college schedule right now in Demo Mode, or upload your own timetable in under a minute.
              </p>
              <div className="pt-6 flex flex-col sm:flex-row justify-center gap-4">
                <NextLink href="/dashboard" className="outline-none block w-full sm:w-auto rounded-xl">
                  <motion.div
                    whileHover={shouldReduceMotion ? {} : { y: -2, scale: 1.01, filter: "brightness(1.05)" }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    className="w-full px-8 py-3.5 rounded-xl bg-slate-50 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 group shadow-lg shadow-[#5EEAD4]/10 hover:shadow-[#5EEAD4]/25"
                  >
                    <Zap className="w-4 h-4 fill-teal-600 text-teal-600" />
                    <span>Launch Demo Dashboard</span>
                    <motion.div transition={{ duration: 0.2 }} className="group-hover:translate-x-1 hidden sm:block">
                      <ArrowRight className="w-4 h-4" />
                    </motion.div>
                  </motion.div>
                </NextLink>

                <NextLink href="/onboarding" className="outline-none block w-full sm:w-auto rounded-xl">
                  <motion.div
                    whileHover={shouldReduceMotion ? {} : { border: "1px solid rgba(94,234,212,0.4)", backgroundColor: "rgba(30,41,59,0.8)" }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    className="w-full px-8 py-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 shadow-md hover:bg-slate-800 group"
                  >
                    <Sparkles className="w-4 h-4 text-[#5EEAD4] group-hover:scale-110 transition-transform" />
                    <span>AI Timetable Upload</span>
                  </motion.div>
                </NextLink>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
