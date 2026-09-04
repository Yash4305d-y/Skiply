'use client';

import React from 'react';
import NextLink from 'next/link';
import { m, useScroll, useTransform, useReducedMotion, Variants } from 'framer-motion';
import { BrainCircuit, Wand2, ShieldCheck, Zap, UploadCloud, Calendar, Clock, ArrowRight, CheckCircle2, Flame, Smartphone, ChevronDown, LogIn } from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import { getCurrentUser } from '@/actions/auth';
import dynamic from 'next/dynamic';
import { usePerformanceTier } from '@/lib/utils/use-performance-tier';
import { AnimatedRing } from '@/components/ui/animated-ring';
import { AnimatedNumber } from '@/components/ui/animated-number';

const AmbientBackground = dynamic(
  () => import('@/components/layout/ambient-background'),
  { ssr: false }
);

const DashboardPreview = dynamic(
  () => import('@/features/marketing/components/dashboard-preview').then(mod => mod.DashboardPreview),
  { ssr: false, loading: () => <div className="w-full max-w-5xl mx-auto mt-16 min-h-[1100px] md:min-h-[600px] rounded-2xl glass-card animate-pulse" /> }
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
        staggerChildren: 0,
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
      {/* Background is purely decorative */}
      <AmbientBackground />
      
      {/* Navbar fades in first */}
      <div className="animate-in fade-in slide-in-from-top-2 duration-500">
        <Navbar />
      </div>

      <main className="flex-1 relative z-10 flex flex-col w-full">
        {/* HERO SECTION */}
        <section className="relative flex-1 flex flex-col justify-between pt-12 md:pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          {/* Main Hero Content (Centers in available space) */}
          <div className="relative z-10 flex-1 flex flex-col justify-center">
            <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-8 w-full">
            
            {/* Left Side: 60% Width */}
            <div className="flex-1 lg:max-w-[55%] flex flex-col items-start text-left animate-in fade-in slide-in-from-bottom-4 duration-700 pt-8 lg:pt-16">
              {/* Pill Badge */}
              <m.div 
                whileHover={shouldReduceMotion ? {} : { y: -2, scale: 1.02, backgroundColor: "rgba(15, 23, 42, 0.9)" }}
                transition={{ duration: 0.2 }}
                className="mb-10 inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300 text-[13px] font-semibold shadow-lg shadow-black/5 cursor-default"
              >
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>Attendance, automated.</span>
              </m.div>

              {/* Headline */}
              <h1 className="mb-8 text-[40px] sm:text-[56px] md:text-[64px] lg:text-[72px] font-extrabold tracking-[-0.03em] text-white leading-[1.05] max-w-2xl">
                Know exactly when you can <br className="hidden xl:block" /><span className="text-[#5EEAD4]">safely skip.</span>
              </h1>

              {/* Subtitle */}
              <p className="mb-14 text-base sm:text-lg md:text-[20px] text-slate-400 max-w-lg font-normal leading-relaxed">
                Upload your timetable once. We track your classes, calculate your safety margins, and warn you before you drop below required thresholds.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-start gap-4 w-full">
                {isLoggedIn ? (
                  <NextLink href="/dashboard" className="outline-none block w-full sm:w-auto rounded-xl">
                    <m.div
                      whileHover={shouldReduceMotion ? {} : { y: -2, scale: 1.02, filter: "brightness(1.05)" }}
                      whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                      className="btn-interactive w-full px-8 py-4 rounded-xl bg-slate-50 text-slate-950 font-bold text-base flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(94,234,212,0.2)] hover:shadow-[0_0_40px_rgba(94,234,212,0.4)] group"
                    >
                      <Zap className="w-4 h-4 fill-teal-600 text-teal-600" />
                      <span>Open Dashboard</span>
                      <m.div
                        transition={{ duration: 0.2 }}
                        className="group-hover:translate-x-1"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </m.div>
                    </m.div>
                  </NextLink>
                ) : (
                  <NextLink href="/login" className="outline-none block w-full sm:w-auto rounded-xl">
                    <m.div
                      whileHover={shouldReduceMotion ? {} : { y: -2, scale: 1.02, filter: "brightness(1.05)" }}
                      whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                      className="btn-interactive w-full px-8 py-4 rounded-xl bg-slate-50 text-slate-950 font-bold text-base flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(94,234,212,0.2)] hover:shadow-[0_0_40px_rgba(94,234,212,0.4)] group"
                    >
                      <LogIn className="w-4 h-4 text-teal-600" />
                      <span>Get Started</span>
                      <m.div
                        transition={{ duration: 0.2 }}
                        className="group-hover:translate-x-1"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </m.div>
                    </m.div>
                  </NextLink>
                )}
              </div>
            </div>

            {/* Right Side: 45% Width (Dashboard Preview) */}
            <div className="w-full lg:w-[45%] flex-shrink-0 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 relative lg:translate-x-4">
              <DashboardPreview />
            </div>
          </div>
          </div>

          {/* Trust Bar (Anchors to bottom, flush with footer) */}
          <div className="relative z-10 pt-8 lg:pt-10 pb-8 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-sm text-slate-400 font-medium animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 border-t border-slate-800/50 mt-12 w-full">
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-slate-400" /> Timetable Import</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-slate-400" /> Skip Calculator</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-slate-400" /> Real-time Margins</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-slate-400" /> Semester Logs</span>
          </div>
        </section>

        {false && (
          <div className="unused-sections-kept-for-future">
            {/* FEATURE CARDS GRID */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10 overflow-visible">
          {/* Features Soft Reflection with Parallax */}
          <m.div 
            style={{ y: shouldReduceMotion ? 0 : yFeaturesAurora }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-sky-400/5 blur-[120px] rounded-full pointer-events-none -z-10" 
          />

          <m.div 
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
          </m.div>

          <m.div 
            variants={featureContainerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-4 gap-8"
          >
            {[
              {
                icon: ShieldCheck,
                color: "text-emerald-400",
                title: "Exact Safe Skip Calculator",
                desc: "Our deterministic math engine calculates the precise number of lectures you can skip per subject, factoring in remaining semester days and upcoming academic holidays.",
                className: "md:col-span-2 md:row-span-2 flex flex-col md:justify-between glass-card border border-white/5 bg-slate-900/60 shadow-xl shadow-black/20",
                visual: (
                  <div className="mt-8 flex justify-center md:justify-end">
                    <div className="relative flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950/50 border border-slate-800 shadow-inner">
                      <AnimatedRing percentage={82.4} size={140} strokeWidth={10} colorClass="text-emerald-400" />
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-white"><AnimatedNumber value={82.4} suffix="%" /></span>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-1">Attendance</span>
                      </div>
                    </div>
                  </div>
                )
              },
              {
                icon: Wand2,
                color: "text-slate-100",
                title: "60-Second AI Setup",
                desc: "Just snap a photo of your college notice board or timetable PDF. Gemini Vision OCR extracts course codes, titles, lab blocks, and exam holidays automatically.",
                className: "md:col-span-2 md:row-span-1 bg-slate-900/40 border-slate-800"
              },
              {
                icon: Flame,
                color: "text-rose-400",
                title: "Danger Zone Recovery",
                desc: "If your attendance drops below your target threshold, Skiply calculates exactly how many consecutive lectures you must attend to get back in the green.",
                className: "md:col-span-1 md:row-span-1 bg-slate-900/40 border-slate-800"
              },
              {
                icon: Clock,
                color: "text-sky-400",
                title: "Single-Tap Daily Tracking",
                desc: "No complex submenus. Every morning, tap Present, Absent, or Cancelled for your scheduled classes in less than 3 seconds.",
                className: "md:col-span-1 md:row-span-1 bg-slate-900/40 border-slate-800"
              },
              {
                icon: Smartphone,
                color: "text-emerald-400",
                title: "Works Offline in Lecture Halls",
                desc: "Basement lecture hall with no cellular signal? No problem. Skiply works as an offline Progressive Web App with local storage and background synchronization.",
                className: "md:col-span-2 md:row-span-1 bg-slate-900/40 border-slate-800"
              },
              {
                icon: Calendar,
                color: "text-amber-400",
                title: "Full Semester Audit History",
                desc: "Maintain a verifiable log of every class attended across the entire semester. Filter by course or date, and edit logs anytime if you made a mistake.",
                className: "md:col-span-2 md:row-span-1 bg-slate-900/40 border-slate-800"
              }
            ].map((feature, i) => (
              <m.div 
                key={i}
                variants={featureCardVariant}
                whileHover={isLowEnd ? {} : (shouldReduceMotion ? {} : { y: -4 })}
                whileTap={isLowEnd ? {} : (shouldReduceMotion ? {} : { scale: 0.98 })}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`border card-interactive p-8 md:p-10 rounded-3xl space-y-4 group hover:bg-slate-900/70 overflow-hidden ${feature.className || ''}`}
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-6">
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2 tracking-[-0.01em]">{feature.title}</h3>
                <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                  {feature.desc}
                </p>
                {feature.visual && feature.visual}
              </m.div>
            ))}
          </m.div>
        </section>

        {/* BOTTOM BANNER CTA */}
        <section className="py-32 md:py-48 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto relative z-10 border-t border-slate-800/50 mt-16">
          <m.div 
            variants={sectionRevealVariant}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="flex flex-col items-center justify-center text-center gap-10"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-[-0.02em] leading-[1.1] max-w-2xl mx-auto">
              Ready to take control of your attendance?
            </h2>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto">
                {isLoggedIn ? (
                  <NextLink href="/dashboard" className="outline-none block w-full sm:w-auto rounded-xl">
                    <m.div
                      whileHover={shouldReduceMotion ? {} : { y: -2, scale: 1.02, filter: "brightness(1.05)" }}
                      whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                      className="w-full px-10 py-4 rounded-xl bg-slate-50 text-slate-950 font-bold text-base flex items-center justify-center gap-2 group shadow-lg shadow-[#5EEAD4]/10 hover:shadow-[#5EEAD4]/25"
                    >
                      <Zap className="w-5 h-5 fill-teal-600 text-teal-600" />
                      <span>Dashboard</span>
                      <m.div transition={{ duration: 0.2 }} className="group-hover:translate-x-1 hidden sm:block">
                        <ArrowRight className="w-5 h-5" />
                      </m.div>
                    </m.div>
                  </NextLink>
                ) : (
                  <NextLink href="/login" className="outline-none block w-full sm:w-auto rounded-xl">
                    <m.div
                      whileHover={shouldReduceMotion ? {} : { y: -2, scale: 1.02, filter: "brightness(1.05)" }}
                      whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                      className="w-full px-10 py-4 rounded-xl bg-slate-50 text-slate-950 font-bold text-base flex items-center justify-center gap-2 group shadow-lg shadow-[#5EEAD4]/10 hover:shadow-[#5EEAD4]/25"
                    >
                      <LogIn className="w-5 h-5 text-teal-600" />
                      <span>Sign In</span>
                      <m.div transition={{ duration: 0.2 }} className="group-hover:translate-x-1 hidden sm:block">
                        <ArrowRight className="w-5 h-5" />
                      </m.div>
                    </m.div>
                  </NextLink>
                )}
              </div>
          </m.div>
        </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
