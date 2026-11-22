'use client';

import React from 'react';
import dynamic from 'next/dynamic';
const OnboardingWizard = dynamic(() => import('@/features/onboarding/components/onboarding-wizard'), {
  ssr: false,
  loading: () => <div className="animate-pulse h-[600px] bg-[#121417] rounded-2xl border border-white/[0.06] max-w-4xl mx-auto" />
});
import Navbar from '@/components/layout/navbar';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen min-h-dvh flex flex-col bg-[#0B0C0E]">
      <Navbar />
      <main className="flex-1 pt-8 pb-28 sm:pb-32 md:py-8">
        <OnboardingWizard />
      </main>
    </div>
  );
}
