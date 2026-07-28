'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, Flame, TrendingUp, Calendar, CheckCircle2, XCircle, AlertOctagon } from 'lucide-react';
import { OverallSemesterStats } from '@/types';

interface HeroWidgetProps {
  stats: OverallSemesterStats;
  onUpdateTarget?: (newTarget: number) => void;
}

export default function HeroWidget({ stats, onUpdateTarget }: HeroWidgetProps) {
  const isSafe = stats.status === 'SAFE';
  const isWarning = stats.status === 'WARNING';
  const isDanger = stats.status === 'DANGER';

  const progressColor = isDanger 
    ? 'bg-gradient-to-r from-rose-600 to-red-500 shadow-rose-500/50' 
    : isWarning 
    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-amber-500/50' 
    : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 shadow-emerald-500/50';

  const badgeColor = isDanger 
    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
    : isWarning 
    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

  const Icon = isDanger ? AlertOctagon : isWarning ? AlertTriangle : ShieldCheck;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden border-indigo-500/30 shadow-2xl"
    >
      {/* Subtle background glow depending on status */}
      <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none ${
        isDanger ? 'bg-rose-600' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
      }`} />
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Content: Hero Text */}
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badgeColor}`}>
              <Icon className="w-3.5 h-3.5" />
              <span>{isDanger ? 'Critical Recovery Mode' : isWarning ? 'Borderline Alert' : 'Safe Skip Buffer Active'}</span>
            </span>
            <span className="text-xs text-slate-400 font-medium">Target: {stats.target_percentage}%</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            {stats.hero_message}
          </h2>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            {stats.hero_subtext}
          </p>
        </div>

        {/* Right Content: Big Percentage Gauge */}
        <div className="flex flex-col items-center justify-center bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl min-w-[180px] shadow-inner text-center">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Overall Semester</span>
          <div className="text-4xl sm:text-5xl font-black text-white tracking-tighter">
            {stats.overall_percentage}%
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-slate-400">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            <span>{stats.total_conducted} lectures conducted</span>
          </div>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="mt-8 space-y-2 relative z-10">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-slate-300">Attendance Progress</span>
          <span className="text-slate-400">
            {stats.total_present} Present / {stats.total_conducted} Conducted Till Date
          </span>
        </div>

        <div className="relative h-4 w-full bg-slate-900/90 rounded-full overflow-hidden border border-slate-800 p-0.5">
          {/* Target Threshold Marker Line */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-white z-20 shadow-[0_0_8px_2px_rgba(255,255,255,0.8)]"
            style={{ left: `${stats.target_percentage}%` }}
            title={`Required Minimum: ${stats.target_percentage}%`}
          />

          {/* Animated Fill Bar */}
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, stats.overall_percentage)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${progressColor} shadow-md`}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium pt-0.5">
          <span>50%</span>
          {onUpdateTarget ? (
            <div className="flex items-center gap-2 w-1/2 max-w-[200px] z-30">
              <input 
                type="range" 
                min="50" max="100" step="1" 
                value={stats.target_percentage} 
                onChange={(e) => onUpdateTarget(Number(e.target.value))} 
                className="w-full accent-white bg-slate-800 h-1 rounded-lg cursor-pointer"
                title="Drag to change your target attendance instantly"
              />
              <span className="text-white font-bold bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 whitespace-nowrap">
                🎯 {stats.target_percentage}% Target
              </span>
            </div>
          ) : (
            <span 
              className="text-white font-bold bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700" 
              style={{ marginLeft: `${Math.max(-20, Math.min(20, stats.target_percentage - 50))}%` }}
            >
              🎯 {stats.target_percentage}% Target
            </span>
          )}
          <span>100%</span>
        </div>
      </div>

      {/* Quick Stat Pills Footer */}
      <div className="mt-6 pt-6 border-t border-slate-800/60 grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/60 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">{stats.total_present}</div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Present</div>
          </div>
        </div>

        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/60 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
            <XCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">{stats.total_absent}</div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Absent</div>
          </div>
        </div>

        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/60 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">{stats.total_remaining}</div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Remaining Lectures</div>
          </div>
        </div>

        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/60 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">{stats.total_safe_skips}</div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Safe Skips</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
