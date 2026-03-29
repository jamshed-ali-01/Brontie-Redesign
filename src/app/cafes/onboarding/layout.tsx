'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function OnboardingLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const response = await fetch('/api/cafes/profile');
        if (response.ok) {
          const merchant = await response.json();
          
          // Legacy Cutoff: March 29, 2026
          const isLegacy = new Date(merchant.createdAt) < new Date('2026-03-29');

          // If onboarding is completed (signupStep >= 8) OR legacy merchant
          if (merchant.signupStep >= 8 || isLegacy) {
             router.replace('/cafes/dashboard');
          } else {
             setLoading(false);
          }
        } else {
          // If not logged in, redirect to login
          router.replace('/cafes/login');
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
        setLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fef6eb] flex items-center justify-center font-sans tracking-tight">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-[#6ca3a4] border-t-transparent rounded-full animate-spin"></div>
           <p className="text-[#6ca3a4] font-black uppercase text-[10px] tracking-widest animate-pulse">Syncing Profile...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
