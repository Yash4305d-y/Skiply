'use client';

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { m, AnimatePresence } from 'framer-motion';
import { Sparkles, LayoutDashboard, History, LogOut, LogIn, Menu, X } from 'lucide-react';
import { getDemoProfile } from '@/lib/demo-store';
import { getCurrentUser, signOut } from '@/actions/auth';
import { usePerformanceTier } from '@/lib/utils/use-performance-tier';

// Paths that require authentication
const PROTECTED_PATHS = ['/dashboard', '/history', '/onboarding'];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLowEnd } = usePerformanceTier();
  const [userName, setUserName] = useState('Demo Student');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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
        <NextLink href="/" className="shrink-0 p-1 -ml-1 rounded-2xl outline-none group focus-visible:ring-2 ring-[#5EEAD4] block">
          <m.div 
            whileHover="hover"
            whileTap="tap"
            variants={{
              hover: {},
              tap: { scale: 0.98 }
            }}
            className="flex items-center gap-3 sm:gap-4"
          >
            {/* Logo Container */}
            <m.div 
              variants={{
                hover: { y: -2, scale: 1.03 }
              }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-10 h-10 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center"
            >
              {/* Breathing Ambient Glow — disabled on low-end */}
              <m.div 
                initial={{ opacity: 0.1 }}
                animate={isLowEnd ? {} : { opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                variants={{
                  hover: { opacity: 0.3, scale: 1.1, transition: { duration: 0.2 } }
                }}
                className="absolute inset-[-20%] bg-[radial-gradient(circle,rgba(94,234,212,1)_0%,transparent_70%)] rounded-full pointer-events-none" 
              />
              
              {/* App Icon Container */}
              <div className="relative w-full h-full rounded-[12px] sm:rounded-[16px] flex items-center justify-center border border-black/[0.04] shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),inset_0_-1px_1px_rgba(0,0,0,0.05),0_4px_10px_rgba(0,0,0,0.25)] bg-[#F6F8FB] z-10 overflow-hidden transition-shadow duration-200 group-hover:shadow-[inset_0_1px_2px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.05),0_6px_14px_rgba(0,0,0,0.35)]">
                <Image src="/nav-logo.png" alt="Skiply Icon" width={64} height={64} className="w-full h-full object-contain" />
              </div>
            </m.div>
            
            {/* Text block */}
            <div className="flex flex-col justify-center">
              <span className="text-xl sm:text-[28px] md:text-[32px] font-bold tracking-[-0.02em] text-white group-hover:brightness-110 transition-all leading-[1.05]">
                Skiply
              </span>
              <span className="text-[11px] sm:text-[12px] font-medium text-[#5EEAD4] tracking-[0.15em] opacity-70 group-hover:opacity-90 transition-opacity hidden sm:block leading-none mt-0.5 uppercase">
                Smart Attendance Platform
              </span>
            </div>
          </m.div>
        </NextLink>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80 shrink-0 relative">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isProtected = PROTECTED_PATHS.includes(item.href);
            return (
              <NextLink
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  if (isProtected && !isLoggedIn) {
                    e.preventDefault();
                    router.push(`/login?redirect=${encodeURIComponent(item.href)}`);
                  }
                }}
                className={`relative px-3 py-1.5 rounded-xl text-base font-semibold flex items-center gap-2 transition-colors duration-200 ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <m.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-slate-800/80 rounded-xl border border-white/5"
                    transition={{ duration: 0.2, ease: "easeOut" }}
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
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-transparent border border-slate-800 hover:bg-slate-800/50 transition-colors cursor-default text-xs text-slate-300">
            <div className={`w-1.5 h-1.5 rounded-full ${isLoggedIn ? 'bg-teal-400' : 'bg-emerald-400'}`} />
            <span className="font-medium text-slate-400">{isLoggedIn ? 'ID:' : 'Student:'}</span>
            <span className="font-semibold text-slate-100">{userName}</span>
          </div>

          <div className="hidden md:block">
            {isLoggedIn ? (
              <button
                onClick={() => signOut()}
                className="btn-interactive px-3 py-1.5 rounded-xl bg-transparent text-slate-400 hover:text-rose-400 border border-transparent flex items-center justify-center min-h-[44px] gap-1.5 text-base font-semibold shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">Sign Out</span>
              </button>
            ) : (
              <NextLink
                href="/login"
                className="btn-interactive px-3 py-1.5 rounded-xl bg-slate-800 text-slate-100 border border-slate-700 flex items-center justify-center min-h-[44px] gap-1.5 text-base font-semibold shadow-sm shrink-0"
                title="Sign In"
              >
                <LogIn className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">Sign In</span>
              </NextLink>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button 
            className="md:hidden p-2 text-slate-300 hover:text-white transition-colors focus:outline-none flex items-center justify-center min-h-[44px] min-w-[44px]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <m.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="md:hidden absolute top-[72px] left-0 right-0 bg-slate-950/95 backdrop-blur-3xl border-b border-white/[0.08] shadow-2xl z-40"
          >
            <div className="px-4 py-6 flex flex-col gap-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const isProtected = PROTECTED_PATHS.includes(item.href);
                return (
                  <NextLink
                    key={item.href}
                    href={item.href}
                    onClick={(e) => {
                      setIsMobileMenuOpen(false);
                      if (isProtected && !isLoggedIn) {
                        e.preventDefault();
                        router.push(`/login?redirect=${encodeURIComponent(item.href)}`);
                      }
                    }}
                    className={`flex items-center gap-3 p-3.5 rounded-xl transition-colors ${
                      isActive ? 'bg-slate-800/80 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-semibold text-base">{item.name}</span>
                  </NextLink>
                );
              })}
              
              <div className="h-px bg-slate-800/50 my-2" />
              
              {isLoggedIn ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-teal-400" />
                    <span>Logged in as </span>
                    <span className="font-semibold text-slate-100">{userName}</span>
                  </div>
                  <button
                    onClick={() => { signOut(); setIsMobileMenuOpen(false); }}
                    className="flex items-center gap-3 p-3.5 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-semibold text-base">Sign Out</span>
                  </button>
                </div>
              ) : (
                <NextLink
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 p-3.5 mt-2 rounded-xl bg-slate-800 text-white font-semibold border border-slate-700 hover:bg-slate-700 transition-colors"
                >
                  <LogIn className="w-5 h-5" />
                  <span className="text-base">Sign In</span>
                </NextLink>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
}
