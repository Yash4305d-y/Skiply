import React from 'react';
import NextLink from 'next/link';
import { Sparkles, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/60 bg-transparent py-8 text-slate-400 text-xs mt-auto pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-4">
        <div className="flex flex-wrap items-center justify-center gap-2 text-center">
          <div className="w-6 h-6 rounded-lg bg-teal-600/20 text-teal-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-300">Skiply (Attendra AI)</span>
          <span className="block sm:inline w-full sm:w-auto mt-1 sm:mt-0">— Zero-friction college attendance planner.</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-3">
          <NextLink href="/onboarding" className="link-interactive text-slate-400 whitespace-nowrap">AI Onboarding</NextLink>
          <NextLink href="/dashboard" className="link-interactive text-slate-400 whitespace-nowrap">Safe Skips Math</NextLink>
          <NextLink href="/history" className="link-interactive text-slate-400 whitespace-nowrap">Audit History</NextLink>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="flex items-center justify-center gap-1 text-slate-400 w-full sm:w-auto mt-2 sm:mt-0">
            Built with <Heart className="w-3 h-3 text-rose-500 fill-rose-500 shrink-0" /> for Students
          </span>
        </div>
      </div>
    </footer>
  );
}
