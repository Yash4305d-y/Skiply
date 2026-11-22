'use client';

import React, { useRef, useEffect } from 'react';
import { m, useMotionValue, useSpring } from 'framer-motion';
import { usePerformanceTier } from '@/lib/utils/use-performance-tier';

interface RubberBandContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function RubberBandContainer({ children, className = '' }: RubberBandContainerProps) {
  const { isLowEnd } = usePerformanceTier();
  const y = useMotionValue(0);
  const springY = useSpring(y, {
    stiffness: 420,
    damping: 30,
    mass: 0.8,
  });

  const touchStartY = useRef<number | null>(null);
  const isRubberBanding = useRef(false);

  useEffect(() => {
    if (isLowEnd || typeof window === 'undefined') return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      touchStartY.current = e.touches[0].clientY;
      isRubberBanding.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY.current === null || e.touches.length !== 1) return;
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - touchStartY.current;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const atTop = scrollTop <= 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 2;

      // Pulling down at top
      if (atTop && deltaY > 0) {
        isRubberBanding.current = true;
        // Dampened logarithmic resistance curve
        const dampened = Math.pow(deltaY, 0.75) * 0.45;
        y.set(Math.min(dampened, 80)); // cap max pull
        if (e.cancelable && deltaY > 10) {
          e.preventDefault();
        }
      } 
      // Pulling up at bottom
      else if (atBottom && deltaY < 0) {
        isRubberBanding.current = true;
        const absDelta = Math.abs(deltaY);
        const dampened = -Math.pow(absDelta, 0.75) * 0.45;
        y.set(Math.max(dampened, -80));
        if (e.cancelable && absDelta > 10) {
          e.preventDefault();
        }
      } else {
        if (isRubberBanding.current) {
          y.set(0);
          isRubberBanding.current = false;
        }
      }
    };

    const handleTouchEnd = () => {
      touchStartY.current = null;
      if (isRubberBanding.current) {
        y.set(0);
        isRubberBanding.current = false;
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [y, isLowEnd]);

  if (isLowEnd) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div style={{ y: springY }} className={className}>
      {children}
    </m.div>
  );
}
