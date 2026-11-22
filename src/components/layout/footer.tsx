import React from 'react';
import NextLink from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#0B0C0E] py-6 text-slate-400 text-xs mt-auto pb-20 md:pb-6 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">Skiply</span>
          <span className="text-slate-500">— Attendance planner</span>
        </div>
        <div className="flex items-center gap-5">
          <NextLink href="/onboarding" className="text-slate-400 hover:text-white transition-colors">
            Onboarding
          </NextLink>
          <NextLink href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
            Dashboard
          </NextLink>
          <NextLink href="/history" className="text-slate-400 hover:text-white transition-colors">
            Attendance audit
          </NextLink>
        </div>
      </div>
    </footer>
  );
}
