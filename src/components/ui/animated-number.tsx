'use client';

import React, { useEffect, useRef } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  duration?: number; // in milliseconds
  className?: string;
  suffix?: string;
}

export function AnimatedNumber({ value, duration = 1000, className, suffix = "" }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!ref.current) return;

    if (shouldReduceMotion || !isInView) {
      ref.current.textContent = Intl.NumberFormat('en-US').format(value) + suffix;
      return;
    }

    let startTimestamp: number | null = null;
    let animFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutQuad curve: 1 - (1 - progress)^2 matching Framer easeOut
      const eased = 1 - Math.pow(1 - progress, 2);
      const current = Math.round(eased * value);

      if (ref.current) {
        ref.current.textContent = Intl.NumberFormat('en-US').format(current) + suffix;
      }

      if (progress < 1) {
        animFrameId = requestAnimationFrame(step);
      } else if (ref.current) {
        ref.current.textContent = Intl.NumberFormat('en-US').format(value) + suffix;
      }
    };

    animFrameId = requestAnimationFrame(step);

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, [isInView, value, duration, shouldReduceMotion, suffix]);

  return (
    <span ref={ref} className={className}>
      {shouldReduceMotion ? Intl.NumberFormat('en-US').format(value) + suffix : "0" + suffix}
    </span>
  );
}
