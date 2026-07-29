import React from 'react';
import NextLink from 'next/link';
import { Sparkles, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/60 bg-slate-950 py-8 text-slate-400 text-xs mt-auto pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-teal-600/20 text-teal-400 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-300">Skiply (Attendra AI)</span>
          <span>— Zero-friction college attendance planner.</span>
        </div>

        <div className="flex items-center gap-6">
          <NextLink href="/onboarding" className="hover:text-teal-400 transition-colors">AI Onboarding</NextLink>
          <NextLink href="/dashboard" className="hover:text-teal-400 transition-colors">Safe Skips Math</NextLink>
          <NextLink href="/history" className="hover:text-teal-400 transition-colors">Audit History</NextLink>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1 text-slate-500">
            Built with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for Students
          </span>
        </div>
      </div>
    </footer>
  );
}
