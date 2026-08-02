'use client';

import React from 'react';
import { m } from 'framer-motion';
import { ShieldCheck, AlertTriangle, Flame, Calendar, CheckCircle2, XCircle, AlertOctagon, Target } from 'lucide-react';
import { OverallSemesterStats } from '@/types';
import { AnimatedNumber } from '@/components/ui/animated-number';

interface HeroWidgetProps {
  stats: OverallSemesterStats;
  onUpdateTarget?: (newTarget: number) => void;
}

export default function HeroWidget({ stats, onUpdateTarget }: HeroWidgetProps) {
  const isSafe = stats.status === 'SAFE';
  const isWarning = stats.status === 'WARNING';
  const isDanger = stats.status === 'DANGER';

  const isAboveTarget = stats.overall_percentage > stats.target_percentage;

  let badgeColor = isDanger 
    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
    : isWarning 
    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

  let Icon = isDanger ? AlertOctagon : isWarning ? AlertTriangle : ShieldCheck;
  let badgeText = isDanger ? 'Critical Recovery' : isWarning ? 'Borderline Alert' : 'Safe Buffer Active';

  if (isAboveTarget) {
    badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    Icon = ShieldCheck;
    if (isDanger || isWarning) {
      badgeText = 'Recovered';
    }
  }

  return (
    <div className="space-y-4">
      {/* CARD 1: Overall Progress & Target */}
      <m.div 
        variants={{
          hidden: { opacity: 0, y: 12 },
          show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
        }}
        className="glass-card card-interactive premium-gradient-border rounded-2xl p-5 bg-slate-900/40 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${badgeColor}`}>
            <Icon className="w-3 h-3" />
            <span>{badgeText}</span>
          </span>
        </div>

        <div className="flex items-end justify-between mb-3">
          <div className="text-3xl sm:text-[36px] md:text-[40px] font-bold text-white tracking-tight leading-none flex items-center">
            <AnimatedNumber value={stats.overall_percentage} duration={1000} />%
          </div>
          <div className="text-xs text-slate-400 font-medium">
            <AnimatedNumber value={stats.total_present} duration={800} /> / <AnimatedNumber value={stats.total_conducted} duration={800} /> classes
          </div>
        </div>

        {/* Thin progress bar */}
        <div className="relative h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-4">
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-slate-300 z-20"
            style={{ left: `${stats.target_percentage}%` }}
            title={`Required Minimum: ${stats.target_percentage}%`}
          />
          <m.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, stats.overall_percentage)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`absolute top-0 bottom-0 left-0 h-full rounded-full z-10 ${isAboveTarget ? 'bg-emerald-500' : 'bg-rose-500'}`}
          />
        </div>

        {/* Target Slider */}
        {onUpdateTarget && (
          <div className="flex items-center gap-3 pt-4 border-t border-white/5">
            <Target className="w-4 h-4 text-slate-400" />
            <input 
              type="range" 
              aria-label="Target attendance percentage"
              min="50" max="100" step="1" 
              value={stats.target_percentage} 
              onChange={(e) => onUpdateTarget(Number(e.target.value))} 
              className="input-interactive flex-1 accent-slate-300 bg-slate-800 h-1 rounded-lg cursor-pointer border border-transparent hover:border-slate-600 focus:outline-none"
              title="Drag to change your target attendance instantly"
            />
            <span className="text-xs font-bold text-slate-300 w-9 text-right">
              {stats.target_percentage}%
            </span>
          </div>
        )}
      </m.div>

      {/* CARD 2: Hero Message block */}
      <m.div
        variants={{
          hidden: { opacity: 0, y: 12 },
          show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
        }}
        className="glass-card card-interactive rounded-2xl p-5 border border-white/5 bg-slate-900/40 shadow-sm"
      >
        <h3 className="text-lg font-bold text-white mb-1.5 leading-tight">
          {stats.hero_message}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          {stats.hero_subtext}
        </p>
      </m.div>

      {/* GRID 3: Mini Stat Cards (2x2 Grid) */}
      <m.div
        variants={{
          hidden: { opacity: 0, y: 12 },
          show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
        }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="bg-slate-900/40 card-interactive p-4 rounded-2xl border border-white/5 flex flex-col gap-1 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-400/80 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Present</span>
          </div>
          <div className="text-xl font-bold text-slate-100"><AnimatedNumber value={stats.total_present} duration={800} /></div>
        </div>

        <div className="bg-slate-900/40 card-interactive p-4 rounded-2xl border border-white/5 flex flex-col gap-1 shadow-sm">
          <div className="flex items-center gap-2 text-rose-400/80 mb-1">
            <XCircle className="w-4 h-4" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Absent</span>
          </div>
          <div className="text-xl font-bold text-slate-100"><AnimatedNumber value={stats.total_absent} duration={800} /></div>
        </div>

        <div className="bg-slate-900/40 card-interactive p-4 rounded-2xl border border-white/5 flex flex-col gap-1 shadow-sm">
          <div className="flex items-center gap-2 text-sky-400/80 mb-1">
            <Flame className="w-4 h-4" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Safe Skips</span>
          </div>
          <div className="text-xl font-bold text-slate-100"><AnimatedNumber value={stats.total_safe_skips} duration={800} /></div>
        </div>

        <div className="bg-slate-900/40 card-interactive p-4 rounded-2xl border border-white/5 flex flex-col gap-1 shadow-sm">
          <div className="flex items-center gap-2 text-teal-400/80 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Remaining</span>
          </div>
          <div className="text-xl font-bold text-slate-100"><AnimatedNumber value={stats.total_remaining} duration={800} /></div>
        </div>
      </m.div>
    </div>
  );
}
