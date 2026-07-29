'use client';

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import Image from 'next/image';
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
    <header className="sticky top-0 z-50 bg-slate-950/60 backdrop-blur-2xl border-b border-white/[0.04] shadow-sm">
      <div 
        className="max-w-7xl mx-auto h-16 flex items-center justify-between gap-4"
        style={{
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))'
        }}
      >
        {/* Logo */}
        <NextLink href="/" className="btn-interactive flex items-center gap-2 sm:gap-3 shrink min-w-0 p-1 -ml-1 rounded-xl">
          <div className="w-8 h-8 shrink-0 rounded-lg overflow-hidden flex items-center justify-center border border-white/5 shadow-sm">
            <Image src="/logo.png" alt="Skiply Logo" width={32} height={32} className="w-full h-full object-cover" />
          </div>
          <div className="truncate">
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-50 flex items-center gap-1.5 sm:gap-2">
              Skiply <span className="hidden sm:flex text-[10px] uppercase font-semibold text-teal-400/90 tracking-wider">Attendra AI</span>
            </span>
          </div>
        </NextLink>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <NextLink
                key={item.href}
                href={item.href}
                className={`nav-item-interactive px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  isActive ? 'active' : 'text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NextLink>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-transparent border border-slate-800 hover:bg-slate-800/50 transition-colors cursor-default text-xs text-slate-300">
            <div className={`w-1.5 h-1.5 rounded-full ${isLoggedIn ? 'bg-teal-400' : 'bg-emerald-400'}`} />
            <span className="font-medium text-slate-400">{isLoggedIn ? 'ID:' : 'Student:'}</span>
            <span className="font-semibold text-slate-100">{userName}</span>
          </div>

          {isLoggedIn ? (
            <button
              onClick={() => signOut()}
              className="btn-interactive px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-transparent text-slate-400 hover:text-rose-400 border border-transparent flex items-center gap-1.5 text-xs font-medium shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Sign Out</span>
            </button>
          ) : (
            <NextLink
              href="/login"
              className="btn-interactive px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 flex items-center gap-1.5 text-xs font-medium shadow-sm shrink-0"
              title="Sign In"
            >
              <LogIn className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Sign In</span>
            </NextLink>
          )}

          <NextLink
            href="/onboarding"
            className="btn-interactive md:hidden p-1.5 sm:p-2 rounded-xl bg-teal-600/20 text-teal-400 border border-teal-500/30 shrink-0"
            aria-label="AI Setup"
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          </NextLink>
        </div>
      </div>


      {/* Mobile Bottom Navigation Bar (PWA Friendly) */}
      <div 
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-2xl border-t border-white/[0.04] px-4 py-2.5 flex items-center justify-around"
        style={{
          paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))'
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <NextLink
              key={item.href}
              href={item.href}
              className={`nav-item-interactive flex flex-col items-center gap-1 px-3 py-1 rounded-lg ${
                isActive ? 'text-teal-400 font-semibold' : 'text-slate-500 font-medium'
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-teal-500/10' : 'hover:bg-slate-800/50'}`}>
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
