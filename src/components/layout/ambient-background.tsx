'use client';

import React from 'react';
import { usePerformanceTier } from '@/lib/utils/use-performance-tier';

export default function AmbientBackground() {
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

      {/* 2. Static Subtle Glow */}
      <div className="absolute top-0 left-0 w-[100%] h-[100%] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.03)_0%,transparent_50%)]" />

      {/* 3. Edge Vignette for Depth (always — composited once, cheap) */}
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
