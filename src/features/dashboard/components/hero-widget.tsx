'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Target } from 'lucide-react';
import { OverallSemesterStats } from '@/types';
import { AnimatedNumber } from '@/components/ui/animated-number';

interface HeroWidgetProps {
  stats: OverallSemesterStats;
  onUpdateTarget?: (newTarget: number) => void;
}

export default function HeroWidget({ stats, onUpdateTarget }: HeroWidgetProps) {
  const isWarning = stats.status === 'WARNING';
  const isDanger = stats.status === 'DANGER';
  const isAboveTarget = stats.overall_percentage >= stats.target_percentage;

  let badgeColor = isDanger 
    ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' 
    : isWarning 
    ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' 
    : 'text-teal-400 bg-teal-500/10 border-teal-500/20';

  let Icon = isDanger ? AlertOctagon : isWarning ? AlertTriangle : ShieldCheck;
  let badgeText = isDanger ? 'Critical recovery' : isWarning ? 'Borderline alert' : 'Safe buffer active';

  if (isAboveTarget && (isDanger || isWarning)) {
    badgeColor = 'text-teal-400 bg-teal-500/10 border-teal-500/20';
    Icon = ShieldCheck;
    badgeText = 'Recovered';
  }

  return (
    <div className="bg-[#121417] border border-white/[0.06] rounded-xl p-5 select-none space-y-4">
      {/* Top row: Status badge + Target */}
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${badgeColor}`}>
          <Icon strokeWidth={1.65} className="w-3.5 h-3.5" />
          <span>{badgeText}</span>
        </span>
        <span className="text-xs text-slate-400">Target: {stats.target_percentage}%</span>
      </div>

      {/* Main Metric */}
      <div>
        <div className="flex items-baseline justify-between">
          <div className="text-4xl font-bold text-white tracking-tight tabular-nums">
            <AnimatedNumber value={stats.overall_percentage} duration={600} />%
          </div>
          <div className="text-xs text-slate-400 font-medium tabular-nums">
            <AnimatedNumber value={stats.total_present} duration={600} /> / <AnimatedNumber value={stats.total_conducted} duration={600} /> attended
          </div>
        </div>

        {/* Thin Progress bar with 75% tick */}
        <div className="relative h-1.5 w-full bg-white/[0.08] rounded-full overflow-hidden mt-3">
          <div 
            className="absolute top-0 bottom-0 w-[1.5px] bg-slate-400 z-20"
            style={{ left: `${stats.target_percentage}%` }}
            title={`Required Minimum: ${stats.target_percentage}%`}
          />
          <div 
            style={{ width: `${Math.min(100, stats.overall_percentage)}%` }}
            className={`h-full rounded-full ${isAboveTarget ? 'bg-teal-400' : 'bg-rose-400'}`}
          />
        </div>
      </div>

      {/* Hero message & subtext */}
      <div className="pt-3 border-t border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white leading-tight">
          {stats.hero_message}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
          {stats.hero_subtext}
        </p>
      </div>

      {/* 4 Stat Figures Grid */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/[0.06]">
        <div className="p-2.5 rounded-lg bg-[#181B1F] flex flex-col">
          <span className="text-[11px] text-slate-400 font-medium">Present</span>
          <span className="text-lg font-bold text-white tabular-nums">
            <AnimatedNumber value={stats.total_present} duration={600} />
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-[#181B1F] flex flex-col">
          <span className="text-[11px] text-slate-400 font-medium">Absent</span>
          <span className="text-lg font-bold text-white tabular-nums">
            <AnimatedNumber value={stats.total_absent} duration={600} />
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-[#181B1F] flex flex-col">
          <span className="text-[11px] text-teal-400 font-medium">Safe skips</span>
          <span className="text-lg font-bold text-teal-400 tabular-nums">
            <AnimatedNumber value={stats.total_safe_skips} duration={600} />
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-[#181B1F] flex flex-col">
          <span className="text-[11px] text-slate-400 font-medium">Remaining</span>
          <span className="text-lg font-bold text-white tabular-nums">
            <AnimatedNumber value={stats.total_remaining} duration={600} />
          </span>
        </div>
      </div>

      {/* Target adjustment slider */}
      {onUpdateTarget && (
        <div className="flex items-center gap-2.5 pt-3 border-t border-white/[0.06]">
          <Target strokeWidth={1.65} className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <input 
            type="range" 
            aria-label="Target attendance percentage"
            min="50" max="100" step="1" 
            value={stats.target_percentage} 
            onChange={(e) => onUpdateTarget(Number(e.target.value))} 
            className="flex-1 accent-teal-500 bg-white/10 h-1 rounded-lg cursor-pointer border-none outline-none"
          />
          <span className="text-xs font-semibold text-slate-300 w-8 text-right tabular-nums">
            {stats.target_percentage}%
          </span>
        </div>
      )}
    </div>
  );
}
