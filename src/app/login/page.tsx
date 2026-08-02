'use client';

import React, { useState, useTransition } from 'react';
import NextLink from 'next/link';
import { m, AnimatePresence } from 'framer-motion';
import { Sparkles, User, Lock, ArrowRight, AlertCircle, Loader2, ArrowLeft, ShieldCheck, HelpCircle } from 'lucide-react';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signInWithUniqueId, signUpWithUniqueId } from '@/actions/auth';

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectParam = searchParams.get('redirect') || '/dashboard';
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form states
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(new Date().getTime() + 86400000 * 120).toISOString().split('T')[0]);

  // Pre-fetch the destination immediately after mount in the background
  React.useEffect(() => {
    router.prefetch(redirectParam);
  }, [router, redirectParam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const formData = new FormData();
    formData.set('username', username);
    formData.set('password', password);
    if (activeTab === 'register') {
      formData.set('fullName', fullName);
      formData.set('startDate', startDate);
      formData.set('endDate', endDate);
    }
    formData.set('redirectTo', redirectParam);

    startTransition(async () => {
      try {
        let res;
        if (activeTab === 'login') {
          res = await signInWithUniqueId(formData);
        } else {
          res = await signUpWithUniqueId(formData);
        }
        if (res && res.error) {
          setErrorMsg(res.error);
        }
      } catch (err: unknown) {
        // NEXT_REDIRECT throws an error when redirecting, which is expected behavior
        const errObj = err as Record<string, unknown>;
        const errMsg = typeof errObj?.message === 'string' ? errObj.message : '';
        const errDigest = typeof errObj?.digest === 'string' ? errObj.digest : '';
        if (errMsg.includes('NEXT_REDIRECT') || errDigest.includes('NEXT_REDIRECT')) {
          return;
        }
        setErrorMsg('An unexpected error occurred. Please try again.');
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-teal-500 selection:text-white relative overflow-x-hidden overflow-y-auto pt-24 pb-12 px-4 items-center">
      {/* Refined flat background without orbs */}

      {/* Top Back Link */}
      <div className="absolute top-6 left-6 z-20">
        <NextLink
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-transform active:scale-95 border border-transparent hover:border-white/5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </NextLink>
      </div>

      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md z-10 space-y-6 m-auto"
      >
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 border border-white/5 text-teal-400 mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">
            {activeTab === 'login' ? 'Welcome back to Skiply' : 'Create your Skiply ID'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {activeTab === 'login'
              ? 'Log in with your Username / Student ID and password'
              : 'Set up your unique campus identity in seconds'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/5 bg-slate-900 shadow-lg space-y-6">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-slate-950/80 border border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMsg(null);
              }}
              className={`btn-interactive py-2.5 rounded-xl text-xs sm:text-sm font-bold relative ${
                activeTab === 'login'
                  ? 'text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {activeTab === 'login' && (
                <m.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-slate-800 rounded-lg border border-white/5"
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                />
              )}
              <span className="relative z-10">Log In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMsg(null);
              }}
              className={`btn-interactive py-2.5 rounded-xl text-xs sm:text-sm font-bold relative ${
                activeTab === 'register'
                  ? 'text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {activeTab === 'register' && (
                <m.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-slate-800 rounded-lg border border-white/5"
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                />
              )}
              <span className="relative z-10">Register</span>
            </button>
          </div>

          {/* Inline Error Banner */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <m.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-2.5"
              >
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </m.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / Student ID Field */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Username / Student ID</span>
                <span className="text-[10px] text-teal-400 font-normal">Alphanumeric</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g., alex_2026 or 2026cse01"
                  className="input-interactive w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-teal-500 text-white placeholder-slate-500 text-sm font-medium"
                />
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-slate-400" />
                <span>We map this to your secure internal virtual identifier automatically.</span>
              </p>
            </div>

            {/* Full Name & Dates (Only in Register Tab) */}
            <AnimatePresence mode="wait">
              {activeTab === 'register' && (
                <m.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="space-y-1.5">
                    <label htmlFor="fullName" className="text-xs font-semibold text-slate-300 block">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required={activeTab === 'register'}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g., Alex Mercer"
                        className="input-interactive w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-teal-500 text-white placeholder-slate-500 text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="startDate" className="text-xs font-semibold text-slate-300 block">
                        Semester Start Date
                      </label>
                      <input
                        id="startDate"
                        name="startDate"
                        type="date"
                        required={activeTab === 'register'}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="input-interactive w-full px-3 py-3 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-teal-500 text-white text-sm font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="endDate" className="text-xs font-semibold text-slate-300 block">
                        Semester End Date
                      </label>
                      <input
                        id="endDate"
                        name="endDate"
                        type="date"
                        required={activeTab === 'register'}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="input-interactive w-full px-3 py-3 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-teal-500 text-white text-sm font-medium"
                      />
                    </div>
                  </div>
                </m.div>
              )}
            </AnimatePresence>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-slate-300 block">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="input-interactive w-full pl-10 pr-12 py-3 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-teal-500 text-white placeholder-slate-500 text-sm font-medium"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="btn-interactive w-full py-3 px-6 rounded-xl bg-slate-50 hover:bg-white text-slate-950 font-bold text-sm flex items-center justify-center gap-2 mt-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{activeTab === 'login' ? 'Authenticating...' : 'Creating Identity...'}</span>
                </>
              ) : (
                <>
                  <span>{activeTab === 'login' ? 'Sign In to Dashboard' : 'Register & Continue'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Bottom Guest Mode Footer */}
        <div className="text-center pt-2">
          <NextLink
            href="/dashboard?demo=true"
            className="text-xs text-slate-400 hover:text-teal-400 transition-colors font-medium inline-flex items-center gap-1.5 group"
          >
            <span>Want to test without an account?</span>
            <span className="font-bold underline decoration-teal-500/50 group-hover:decoration-teal-400">Try Demo Dashboard</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </NextLink>
        </div>
      </m.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <LoginContent />
    </Suspense>
  );
}
