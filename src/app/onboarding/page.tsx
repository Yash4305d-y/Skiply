'use client';

import React from 'react';
import dynamic from 'next/dynamic';
const OnboardingWizard = dynamic(() => import('@/features/onboarding/components/onboarding-wizard'), {
  ssr: false,
  loading: () => <div className="animate-pulse h-[600px] bg-slate-900 rounded-2xl border border-slate-800 max-w-4xl mx-auto" />
});
import Navbar from '@/components/layout/navbar';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />
      <main className="flex-1 py-8">
        <OnboardingWizard />
      </main>
    </div>
  );
}
