'use client';

import React, { useRef } from 'react';
import { m, useInView, useReducedMotion } from 'framer-motion';
import { usePerformanceTier } from '@/lib/utils/use-performance-tier';

interface AnimatedRingProps {
  percentage: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
  color?: string;
  trackColorClass?: string;
  duration?: number;
}

export function AnimatedRing({
  percentage,
  size = 64,
  strokeWidth = 6,
  colorClass = "text-teal-500",
  color,
  trackColorClass = "text-slate-800",
  duration = 1000
}: AnimatedRingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });
  const shouldReduceMotion = useReducedMotion();
  const { isLowEnd } = usePerformanceTier();

  const effectiveDuration = isLowEnd ? Math.min(duration, 500) : duration;

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const targetOffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;
  const initialOffset = circumference;

  return (
    <div ref={ref} className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className={trackColorClass}
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <m.circle
          className={colorClass}
          stroke={color || "currentColor"}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: shouldReduceMotion ? targetOffset : initialOffset }}
          animate={{ strokeDashoffset: isInView || shouldReduceMotion ? targetOffset : initialOffset }}
          transition={{ duration: effectiveDuration / 1000, ease: "easeOut" }}
        />
      </svg>
    </div>
  );
}
