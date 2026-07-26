'use client';

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, LayoutDashboard, History, LogOut, LogIn } from 'lucide-react';
import { getDemoProfile } from '@/lib/demo-store';
import { getCurrentUser, signOut } from '@/app/auth/actions';

export default function Navbar() {
  const pathname = usePathname();
  const [userName, setUserName] = useState('Demo Student');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check for real Supabase auth user first
    getCurrentUser().then((user) => {
      if (user && user.full_name) {
        setUserName(`${user.full_name.split(' ')[0]} (${user.unique_id})`);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
        const prof = getDemoProfile();
        if (prof.full_name) setUserName(prof.full_name.split(' ')[0]);
      }
    });
  }, [pathname]);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'History & Audit', href: '/history', icon: History },
    { name: 'AI Onboarding', href: '/onboarding', icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-50 glass-header border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <NextLink href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
              Skiply <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">Attendra AI</span>
            </span>
            <p className="text-[10px] text-slate-400 -mt-0.5 font-medium hidden sm:block">Safe Skip Attendance Calculator</p>
          </div>
        </NextLink>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <NextLink
                key={item.href}
                href={item.href}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.name}</span>
              </NextLink>
            );
          })}
        </nav>

        {/* Right Status Badge */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <div className={`w-2 h-2 rounded-full ${isLoggedIn ? 'bg-indigo-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
            <span className="font-medium text-slate-400">{isLoggedIn ? 'ID:' : 'Student:'}</span>
            <span className="font-bold text-white">{userName}</span>
          </div>

          {isLoggedIn ? (
            <button
              onClick={() => signOut()}
              className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 flex items-center gap-1.5 text-xs font-bold transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline">Sign Out</span>
            </button>
          ) : (
            <NextLink
              href="/login"
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 flex items-center gap-1.5 text-xs font-bold transition-all"
              title="Sign In"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </NextLink>
          )}

          <NextLink
            href="/onboarding"
            className="md:hidden p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
            aria-label="AI Setup"
          >
            <Sparkles className="w-5 h-5" />
          </NextLink>
        </div>
      </div>


      {/* Mobile Bottom Navigation Bar (PWA Friendly) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-header border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-2xl px-4 py-2.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <NextLink
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
                isActive ? 'text-indigo-400 scale-105 font-bold' : 'text-slate-500 font-medium'
              }`}
            >
              <div className={`p-1.5 rounded-xl ${isActive ? 'bg-indigo-500/10' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px]">{item.name}</span>
            </NextLink>
          );
        })}
      </div>
    </header>
  );
}
