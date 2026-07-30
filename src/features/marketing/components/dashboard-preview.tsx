'use client';

import React, { useRef, useState } from 'react';
import { motion, useInView, useReducedMotion, Variants } from 'framer-motion';
import { TrendingUp, Sparkles, CheckCircle2, AlertCircle, XCircle, CircleDashed } from 'lucide-react';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { AnimatedRing } from '@/components/ui/animated-ring';

export function DashboardPreview() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  // Interactive Demo State (Independent from production data)
  const [attendance, setAttendance] = useState(82.4);
  const [safeSkips, setSafeSkips] = useState(14);
  const [weeklyData, setWeeklyData] = useState([65, 75, 82, 78, 90, 85, 95]);
  const [schedule, setSchedule] = useState([
    { id: 1, time: "09:00", code: "CS301", name: "Data Structures", status: "PRESENT", color: "bg-teal-500" },
    { id: 2, time: "11:30", code: "MA201", name: "Linear Algebra", status: "PENDING", color: "bg-indigo-500" },
    { id: 3, time: "14:00", code: "PH102", name: "Physics Lab", status: "PENDING", color: "bg-rose-500" },
  ]);

  const toggleClassStatus = (id: number) => {
    setSchedule(prev => prev.map(cls => {
      if (cls.id !== id) return cls;
      
      let newStatus = "PENDING";
      let diffAttendance = 0;
      let diffSkips = 0;

      // Cycle through states: PENDING -> PRESENT -> ABSENT -> PENDING
      if (cls.status === "PENDING") {
        newStatus = "PRESENT";
        diffAttendance = 1.2;
        diffSkips = 0;
      } else if (cls.status === "PRESENT") {
        newStatus = "ABSENT";
        diffAttendance = -2.5;
        diffSkips = -1;
      } else {
        newStatus = "PENDING";
        diffAttendance = 1.3; // Revert
        diffSkips = 1;      // Revert
      }
      
      // Update mocked stats
      setAttendance(a => Number(Math.max(0, Math.min(100, a + diffAttendance)).toFixed(1)));
      setSafeSkips(s => Math.max(0, s + diffSkips));
      setWeeklyData(data => {
        const newData = [...data];
        // Modify the last data point in the chart to reflect the change
        newData[newData.length - 1] = Math.max(0, Math.min(100, newData[newData.length - 1] + diffAttendance));
        return newData;
      });

      return { ...cls, status: newStatus };
    }));
  };

  // Entrance variants
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 40, scale: shouldReduceMotion ? 1 : 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1], // Custom smooth ease-out
        staggerChildren: 0.1,
        delayChildren: 0.3,
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  // Calculate SVG path for the chart dynamically based on state
  const maxVal = Math.max(100, ...weeklyData);
  const chartWidth = 300;
  const chartHeight = 100;
  const stepX = chartWidth / (weeklyData.length - 1);
  
  const points = weeklyData.map((val, i) => {
    const x = i * stepX;
    const y = chartHeight - (val / maxVal) * chartHeight;
    return `${x},${y}`;
  });
  
  // Smooth curve generation (simplified)
  const pathD = `M ${points[0]} ${points.slice(1).map((p, i) => {
    const [prevX, prevY] = points[i].split(',');
    const [currX, currY] = p.split(',');
    const cp1x = parseFloat(prevX) + stepX / 3;
    const cp2x = parseFloat(currX) - stepX / 3;
    return `C ${cp1x},${prevY} ${cp2x},${currY} ${currX},${currY}`;
  }).join(' ')}`;

  const isWarning = attendance < 75;

  return (
    <motion.div
      ref={containerRef}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "show" : "hidden"}
      className="w-full max-w-5xl mx-auto mt-16 rounded-2xl overflow-hidden glass-card border border-white/10 shadow-2xl shadow-teal-500/10 bg-slate-950/80 backdrop-blur-xl flex flex-col relative group"
    >
      {/* 3D Tilt effect container (desktop only) */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      {/* Mac OS Window Header */}
      <div className="h-10 border-b border-white/5 flex items-center px-4 gap-2 bg-slate-900/50">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-rose-500/80" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
        </div>
        <div className="mx-auto flex items-center gap-2 px-24">
          <div className="w-48 h-5 rounded-md bg-slate-800/50 flex items-center justify-center border border-white/5">
            <span className="text-[10px] text-slate-400 font-medium tracking-wide">skiply.app/dashboard</span>
          </div>
        </div>
      </div>

      {/* Dashboard Body */}
      <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Column (Stats & Charts) */}
        <div className="md:col-span-7 flex flex-col gap-6">
          {/* Top Stats Row */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div variants={itemVariants} className={`p-5 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden transition-colors duration-500 ${isWarning ? 'shadow-[inset_0_0_20px_rgba(244,63,94,0.1)]' : ''}`}>
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${isWarning ? 'from-rose-500 to-orange-400' : 'from-teal-500 to-emerald-400'} transition-colors duration-500`} />
              {isInView && (
                <AnimatedRing 
                  percentage={attendance} 
                  size={120} 
                  strokeWidth={10} 
                  color={isWarning ? "url(#rose-gradient)" : "url(#teal-gradient)"}
                />
              )}
              <svg className="hidden">
                <defs>
                  <linearGradient id="teal-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                  <linearGradient id="rose-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="#fb923c" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute flex flex-col items-center justify-center mt-2">
                <span className="text-2xl font-bold text-white">
                  {isInView ? <AnimatedNumber value={attendance} suffix="%" /> : '0%'}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Overall</span>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="p-5 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col justify-between transition-colors duration-500">
              <div className="flex items-start justify-between">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-500 ${isWarning ? 'bg-rose-500/10 text-rose-400' : 'bg-teal-500/10 text-teal-400'}`}>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors duration-500 ${isWarning ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                  {isWarning ? 'Danger Zone' : 'On Track'}
                </span>
              </div>
              <div className="space-y-1 mt-4">
                <span className={`text-3xl font-bold transition-colors duration-500 ${isWarning ? 'text-rose-400' : 'text-white'}`}>
                  {isInView ? <AnimatedNumber value={safeSkips} /> : 0}
                </span>
                <p className="text-xs text-slate-400 font-medium">{isWarning ? 'Classes to attend' : 'Safe skips remaining'}</p>
              </div>
            </motion.div>
          </div>

          {/* Chart Row */}
          <motion.div variants={itemVariants} className="p-5 rounded-xl bg-slate-900/60 border border-white/5 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-100">Weekly Attendance Trend</h3>
              <span className={`text-xs font-semibold transition-colors duration-500 ${isWarning ? 'text-rose-400' : 'text-teal-400'}`}>
                Interactive Mockup
              </span>
            </div>
            <div className="flex-1 w-full h-[120px] relative mt-2 flex items-end">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between border-l border-b border-slate-800">
                <div className="w-full h-px bg-slate-800/50" />
                <div className="w-full h-px bg-slate-800/50" />
                <div className="w-full h-px bg-slate-800/50" />
              </div>
              
              {/* Animated SVG Chart Line */}
              <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" className="absolute inset-0 overflow-visible">
                {isInView && (
                  <>
                    <motion.path
                      d={pathD}
                      fill="none"
                      stroke={isWarning ? "#f43f5e" : "#5EEAD4"}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1, d: pathD, stroke: isWarning ? "#f43f5e" : "#5EEAD4" }}
                      transition={{ 
                        pathLength: { duration: 1.5, ease: "easeInOut", delay: 0.5 },
                        d: { duration: 0.5, ease: "easeOut" },
                        stroke: { duration: 0.5 }
                      }}
                    />
                    <motion.path
                      d={`${pathD} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`}
                      fill={isWarning ? "url(#chart-gradient-rose)" : "url(#chart-gradient)"}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, d: `${pathD} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`, fill: isWarning ? "url(#chart-gradient-rose)" : "url(#chart-gradient)" }}
                      transition={{ 
                        opacity: { duration: 1, delay: 1 },
                        d: { duration: 0.5, ease: "easeOut" },
                        fill: { duration: 0.5 }
                      }}
                    />
                  </>
                )}
                <defs>
                  <linearGradient id="chart-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(94, 234, 212, 0.2)" />
                    <stop offset="100%" stopColor="rgba(94, 234, 212, 0)" />
                  </linearGradient>
                  <linearGradient id="chart-gradient-rose" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(244, 63, 94, 0.2)" />
                    <stop offset="100%" stopColor="rgba(244, 63, 94, 0)" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </motion.div>
        </div>

        {/* Right Column (Timetable & AI Insight) */}
        <div className="md:col-span-5 flex flex-col gap-6">
          {/* AI Insight Card */}
          <motion.div variants={itemVariants} className="p-4 rounded-xl bg-slate-900/40 border border-white/5 relative overflow-hidden flex flex-col">
            <div className={`absolute top-0 right-0 w-32 h-32 blur-[40px] rounded-full transition-colors duration-500 ${isWarning ? 'bg-rose-500/10' : 'bg-teal-500/10'}`} />
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className={`w-4 h-4 transition-colors duration-500 ${isWarning ? 'text-rose-400' : 'text-teal-400'}`} />
              <h3 className={`text-xs font-bold uppercase tracking-wider transition-colors duration-500 ${isWarning ? 'text-rose-400' : 'text-teal-400'}`}>Attendra AI Insight</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed font-medium relative z-10 transition-all duration-300">
              {isWarning 
                ? <><strong className="text-white">Warning:</strong> Your attendance is dangerously low. You must attend the next {safeSkips} classes consecutively to recover your target.</>
                : <>You can afford to skip <strong className="text-white">Data Structures</strong> tomorrow. You'll still remain above your target threshold.</>}
            </p>
          </motion.div>

          {/* Timetable Slice */}
          <motion.div variants={itemVariants} className="flex-1 p-5 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-100">Today's Schedule</h3>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Click to Toggle</span>
            </div>
            <div className="space-y-3">
              {schedule.map((cls, i) => (
                <motion.button 
                  key={cls.id}
                  onClick={() => toggleClassStatus(cls.id)}
                  whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                  custom={i}
                  variants={{
                    hidden: { opacity: 0, x: shouldReduceMotion ? 0 : 20 },
                    show: i => ({ 
                      opacity: 1, 
                      x: 0, 
                      transition: { delay: 0.8 + (i * 0.1), duration: 0.4, ease: "easeOut" } 
                    })
                  }}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-lg bg-slate-950/50 border border-white/5 hover:bg-slate-800/60 transition-colors group cursor-pointer"
                >
                  <div className={`w-1 h-8 rounded-full ${cls.color}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors">{cls.code}</span>
                      <span className="text-[10px] text-slate-400">{cls.time}</span>
                    </div>
                    <p className="text-xs text-slate-300 truncate">{cls.name}</p>
                  </div>
                  
                  {/* Status Indicator */}
                  {cls.status === "PRESENT" && (
                    <div className="w-7 h-7 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center transition-colors">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                  {cls.status === "ABSENT" && (
                    <div className="w-7 h-7 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center transition-colors">
                      <XCircle className="w-4 h-4" />
                    </div>
                  )}
                  {cls.status === "PENDING" && (
                    <div className="w-7 h-7 rounded-md bg-slate-800/50 text-slate-500 border border-slate-700 flex items-center justify-center transition-colors group-hover:text-slate-400">
                      <CircleDashed className="w-4 h-4" />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>

      </div>
    </motion.div>
  );
}
