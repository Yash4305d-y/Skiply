'use client';

import React from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { usePerformanceTier } from '@/lib/utils/use-performance-tier';

export default function AmbientBackground() {
  const shouldReduceMotion = useReducedMotion();
  const { isLowEnd } = usePerformanceTier();

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-[#08111F]">
      
      {/* 1. Subtle Background Grid (high-end only) */}
      {!isLowEnd && (
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: `radial-gradient(circle at center, rgba(255, 255, 255, 0.8) 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />
      )}

      {/* 2. Top-Left Mint Glow (always rendered — primary ambient) */}
      <m.div
        animate={!shouldReduceMotion ? {
          x: isLowEnd ? [0, 20, 0] : [0, 40, -20, 0],
          y: isLowEnd ? [0, 15, 0] : [0, 30, -30, 0],
        } : {}}
        transition={{
          duration: isLowEnd ? 35 : 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.06)_0%,transparent_70%)]"
      />

      {/* 3. Upper-Right Sky Blue Glow (high-end only) */}
      {!isLowEnd && (
        <m.div
          animate={!shouldReduceMotion ? {
            x: [0, -50, 20, 0],
            y: [0, -20, 40, 0],
          } : {}}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -top-[5%] -right-[15%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.05)_0%,transparent_70%)]"
        />
      )}

      {/* 4. Lower-Center Mint/Sky Blend Glow (high-end only) */}
      {!isLowEnd && (
        <m.div
          animate={!shouldReduceMotion ? {
            x: [0, 30, -40, 0],
            y: [0, -40, 20, 0],
          } : {}}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-[65%] left-[20%] w-[60%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(94,234,212,0.04)_0%,transparent_70%)]"
        />
      )}

      {/* 5. Edge Vignette for Depth (always — composited once, cheap) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(8,17,31,0.85)_100%)]" />

      {/* 6. Fine Monochrome Grain Texture (high-end only) */}
      {!isLowEnd && (
        <div 
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }}
        />
      )}
      
    </div>
  );
}
