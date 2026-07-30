'use client';

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, LayoutDashboard, History, LogOut, LogIn } from 'lucide-react';
import { getDemoProfile } from '@/lib/demo-store';
import { getCurrentUser, signOut } from '@/actions/auth';

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
    <header className="sticky top-0 z-50 bg-slate-950/50 backdrop-blur-3xl border-b border-white/[0.08] shadow-sm hover:border-white/[0.12] transition-colors duration-300">
      <div 
        className="max-w-7xl mx-auto h-[72px] flex items-center justify-between gap-4"
        style={{
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))'
        }}
      >
        {/* Logo */}
        <NextLink href="/" className="shrink min-w-0 p-1 -ml-1 rounded-2xl outline-none group focus-visible:ring-2 ring-[#5EEAD4] block">
          <motion.div 
            whileHover="hover"
            whileTap="tap"
            variants={{
              hover: {},
              tap: { scale: 0.98 }
            }}
            className="flex items-center gap-4 sm:gap-4"
          >
            {/* Logo Container */}
            <motion.div 
              variants={{
                hover: { y: -2, scale: 1.03 }
              }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center"
            >
              {/* Breathing Ambient Glow */}
              <motion.div 
                initial={{ opacity: 0.1 }}
                animate={{ opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                variants={{
                  hover: { opacity: 0.3, scale: 1.1, transition: { duration: 0.2 } }
                }}
                className="absolute inset-[-20%] bg-[#5EEAD4] blur-[24px] rounded-full pointer-events-none" 
              />
              
              {/* App Icon Container */}
              <div className="relative w-full h-full rounded-[16px] flex items-center justify-center border border-black/[0.04] shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),inset_0_-1px_1px_rgba(0,0,0,0.05),0_4px_10px_rgba(0,0,0,0.25)] bg-[#F6F8FB] z-10 overflow-hidden transition-shadow duration-200 group-hover:shadow-[inset_0_1px_2px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.05),0_6px_14px_rgba(0,0,0,0.35)]">
                <Image src="/nav-logo.png" alt="Skiply Icon" width={64} height={64} className="w-full h-full object-contain" />
              </div>
            </motion.div>
            
            {/* Text block */}
            <div className="flex flex-col justify-center">
              <span className="text-[28px] sm:text-[32px] font-bold tracking-[-0.02em] text-white group-hover:brightness-110 transition-all  leading-[1.05]">
                Skiply
              </span>
              <span className="text-[11px] sm:text-[12px] font-medium text-[#5EEAD4] tracking-[0.15em] opacity-70 group-hover:opacity-90 transition-opacity hidden sm:block leading-none mt-0.5  uppercase">
                Smart Attendance Platform
              </span>
            </div>
          </motion.div>
        </NextLink>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80 shrink-0 relative">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <NextLink
                key={item.href}
                href={item.href}
                className={`relative px-3 py-1.5 rounded-xl text-base font-semibold flex items-center gap-2 transition-colors duration-200 ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-slate-800/80 rounded-xl border border-white/5"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className="relative z-10 flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
              </NextLink>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-transparent border border-slate-800 hover:bg-slate-800/50 transition-colors cursor-default text-xs text-slate-300">
            <div className={`w-1.5 h-1.5 rounded-full ${isLoggedIn ? 'bg-teal-400' : 'bg-emerald-400'}`} />
            <span className="font-medium text-slate-400">{isLoggedIn ? 'ID:' : 'Student:'}</span>
            <span className="font-semibold text-slate-100">{userName}</span>
          </div>

          {isLoggedIn ? (
            <button
              onClick={() => signOut()}
              className="btn-interactive px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-transparent text-slate-400 hover:text-rose-400 border border-transparent flex items-center gap-1.5 text-base font-semibold shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Sign Out</span>
            </button>
          ) : (
            <NextLink
              href="/login"
              className="btn-interactive px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 text-slate-100 border border-slate-700 flex items-center gap-1.5 text-base font-semibold shadow-sm shrink-0"
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
              className={`nav-item-interactive flex flex-col items-center gap-1 px-3 py-1 rounded-xl ${
                isActive ? 'text-teal-400 font-semibold' : 'text-slate-500 font-medium'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-teal-500/10' : 'hover:bg-slate-800/50'}`}>
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
