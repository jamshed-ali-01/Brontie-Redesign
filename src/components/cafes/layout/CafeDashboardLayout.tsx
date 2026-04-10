'use client';

import React, { useState, useEffect } from 'react';
import CafeHeader from './CafeHeader';
import CafeSidebar from './CafeSidebar';

interface CafeDashboardLayoutProps {
  children: React.ReactNode;
  cafeName?: string;
  ownerName?: string;
  cafeLogo?: string;
}

// Simple global cache to prevent re-fetching across unmounts within the same SPA session
let cachedProfilePromise: Promise<any> | null = null;
let cachedProfileData: any = null;

export default function CafeDashboardLayout({ children, cafeName: initialCafeName, ownerName: initialOwnerName, cafeLogo: initialCafeLogo }: CafeDashboardLayoutProps) {
  const [merchantData, setMerchantData] = useState<{name: string, logoUrl?: string} | null>(cachedProfileData);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (cachedProfileData) {
      // Already cached and set in initial state
      return;
    }

    if (!cachedProfilePromise) {
      cachedProfilePromise = fetch('/api/cafes/profile').then(res => res.json());
    }

    cachedProfilePromise
      .then(data => {
        if (data && !data.error) {
          cachedProfileData = data;
          setMerchantData(data);
        } else {
          cachedProfilePromise = null; // Failed, allow retry next time
        }
      })
      .catch(err => {
        console.error('Failed to fetch merchant data in layout', err);
        cachedProfilePromise = null;
      });
  }, []);

  const displayCafeName = merchantData?.name || initialCafeName || 'Loading';
  const displayCafeLogo = merchantData?.logoUrl || initialCafeLogo;

  return (
    <div className="min-h-screen bg-[#fbf8f2] font-sans">
      <CafeHeader 
        cafeName={displayCafeName} 
        ownerName={initialOwnerName} 
        cafeLogo={displayCafeLogo}  
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      <CafeSidebar 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      <main className="lg:pl-[260px] pt-[64px] min-h-screen pb-12 transition-all duration-300">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-6 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
