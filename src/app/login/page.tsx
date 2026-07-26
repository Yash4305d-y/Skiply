'use client';

import React, { useState, useTransition } from 'react';
import NextLink from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, User, Lock, ArrowRight, AlertCircle, Loader2, ArrowLeft, ShieldCheck, HelpCircle } from 'lucide-react';
import { signInWithUniqueId, signUpWithUniqueId } from '@/app/auth/actions';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form states
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const formData = new FormData();
    formData.set('username', username);
    formData.set('password', password);
    if (activeTab === 'register') {
      formData.set('fullName', fullName);
    }

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
      } catch (err: any) {
        // NEXT_REDIRECT throws an error when redirecting, which is expected behavior
        if (err?.message?.includes('NEXT_REDIRECT') || err?.digest?.includes('NEXT_REDIRECT')) {
          return;
        }
        setErrorMsg('An unexpected error occurred. Please try again.');
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-hidden justify-center items-center p-4">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-2/3 right-10 w-72 h-72 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none hidden md:block" />

      {/* Top Back Link */}
      <div className="absolute top-6 left-6 z-20">
        <NextLink
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass-card hover:bg-slate-800/80 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-all border border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </NextLink>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md z-10 space-y-6"
      >
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 text-white shadow-xl shadow-indigo-500/25 mb-2 animate-float">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {activeTab === 'login' ? 'Welcome back to Skiply' : 'Create your Skiply ID'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {activeTab === 'login'
              ? 'Log in with your Username / Student ID and password'
              : 'Set up your unique campus identity in seconds'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800/80 shadow-2xl backdrop-blur-2xl bg-slate-900/60 space-y-6">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-slate-950/80 border border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMsg(null);
              }}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all relative ${
                activeTab === 'login'
                  ? 'text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {activeTab === 'login' && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
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
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all relative ${
                activeTab === 'register'
                  ? 'text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {activeTab === 'register' && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
              <span className="relative z-10">Register</span>
            </button>
          </div>

          {/* Inline Error Banner */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-2.5"
              >
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / Student ID Field */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Username / Student ID</span>
                <span className="text-[10px] text-indigo-400 font-normal">Alphanumeric</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
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
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white placeholder-slate-500 text-sm font-medium transition-all outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-slate-500" />
                <span>We map this to your secure internal virtual identifier automatically.</span>
              </p>
            </div>

            {/* Full Name (Only in Register Tab) */}
            <AnimatePresence mode="wait">
              {activeTab === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <label htmlFor="fullName" className="text-xs font-semibold text-slate-300 block">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
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
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white placeholder-slate-500 text-sm font-medium transition-all outline-none"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-slate-300 block">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
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
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white placeholder-slate-500 text-sm font-medium transition-all outline-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none mt-2"
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
            className="text-xs text-slate-400 hover:text-indigo-400 transition-colors font-medium inline-flex items-center gap-1.5 group"
          >
            <span>Want to test without an account?</span>
            <span className="font-bold underline decoration-indigo-500/50 group-hover:decoration-indigo-400">Try Demo Dashboard</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </NextLink>
        </div>
      </motion.div>
    </div>
  );
}
