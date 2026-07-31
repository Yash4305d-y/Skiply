'use client';

import React, { useEffect, useRef } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

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
    if (shouldReduceMotion) {
      if (ref.current) {
        ref.current.textContent = Intl.NumberFormat('en-US').format(value) + suffix;
      }
      return;
    }
    
    if (isInView) {
      const controls = animate(0, value, {
        duration: duration / 1000,
        ease: "easeOut",
        onUpdate: (latest) => {
          if (ref.current) {
            ref.current.textContent = Intl.NumberFormat('en-US').format(Math.round(latest)) + suffix;
          }
        }
      });
      return () => controls.stop();
    }
  }, [isInView, value, duration, shouldReduceMotion]);

  return (
    <span ref={ref} className={className}>
      {shouldReduceMotion ? Intl.NumberFormat('en-US').format(value) + suffix : "0" + suffix}
    </span>
  );
}
