import React from 'react';
import OnboardingWizard from '@/features/onboarding/components/onboarding-wizard';
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
