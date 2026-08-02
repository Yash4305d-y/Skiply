'use client';

import React, { createContext, useContext, useMemo, useSyncExternalStore } from 'react';

// --------------------------------------------------------------------------
// Performance Tier Detection
// --------------------------------------------------------------------------
// Classifies the current device as 'high' or 'low' using two heuristics:
//   1. navigator.deviceMemory  — low if < 4 GB
//   2. navigator.hardwareConcurrency — low if < 4 logical cores
// Falls back to 'high' when the APIs are unavailable (most desktop browsers).
// Also exposes the prefers-reduced-motion media query result reactively.
// --------------------------------------------------------------------------

export type PerformanceTier = 'high' | 'low';

export interface PerformanceProfile {
  /** The computed tier for the current device. */
  tier: PerformanceTier;
  /** Whether the OS-level reduced-motion preference is active. */
  reducedMotion: boolean;
  /** Convenience: true when tier === 'low' OR reducedMotion is true. */
  isLowEnd: boolean;
}

// --------------- reduced-motion subscription (SSR-safe) ---------------

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeToReducedMotion(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getReducedMotionSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

// --------------- tier detection (runs once) ---------------

function detectTier(): PerformanceTier {
  if (typeof navigator === 'undefined') return 'high';

  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const cores = navigator.hardwareConcurrency;

  // If deviceMemory is available and low, classify as low-end
  if (typeof mem === 'number' && mem < 4) return 'low';

  // If hardwareConcurrency is available and low, classify as low-end
  if (typeof cores === 'number' && cores < 4) return 'low';

  return 'high';
}

// --------------- React Context ---------------

const PerformanceTierContext = createContext<PerformanceProfile>({
  tier: 'high',
  reducedMotion: false,
  isLowEnd: false,
});

export function PerformanceTierProvider({ children }: { children: React.ReactNode }) {
  // Detect tier once at mount (stable across renders)
  const tier = useMemo(() => detectTier(), []);

  // Reactively track reduced-motion preference
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  const value = useMemo<PerformanceProfile>(
    () => ({
      tier,
      reducedMotion,
      isLowEnd: tier === 'low' || reducedMotion,
    }),
    [tier, reducedMotion],
  );

  return (
    <PerformanceTierContext.Provider value={value}>
      {children}
    </PerformanceTierContext.Provider>
  );
}

/**
 * Returns the current device performance profile.
 *
 * Usage:
 * ```ts
 * const { isLowEnd, tier, reducedMotion } = usePerformanceTier();
 * ```
 */
export function usePerformanceTier(): PerformanceProfile {
  return useContext(PerformanceTierContext);
}
