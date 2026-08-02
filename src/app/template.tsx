"use client";

import { m } from 'framer-motion';
import { usePerformanceTier } from "@/lib/utils/use-performance-tier";

export default function Template({ children }: { children: React.ReactNode }) {
  const { isLowEnd } = usePerformanceTier();

  return (
    <m.div
      initial={{ opacity: 0, y: isLowEnd ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: isLowEnd ? 0.2 : 0.3,
        ease: "easeOut",
      }}
      className="flex-1 flex flex-col"
    >
      {children}
    </m.div>
  );
}
