'use client';

import { useEffect } from 'react';
import { usePerformanceTier } from '@/lib/utils/use-performance-tier';

/**
 * Applies the `.low-perf` CSS class to the `<html>` element when the
 * device is classified as low-end. This enables CSS-level optimizations
 * (reduced blur, simplified shadows) without JavaScript per-component.
 */
export default function PerformanceClassApplier() {
  const { isLowEnd } = usePerformanceTier();

  useEffect(() => {
    const html = document.documentElement;
    if (isLowEnd) {
      html.classList.add('low-perf');
    } else {
      html.classList.remove('low-perf');
    }
    return () => {
      html.classList.remove('low-perf');
    };
  }, [isLowEnd]);

  return null;
}
