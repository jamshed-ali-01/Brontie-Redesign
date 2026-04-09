'use client';

import React, { useState } from 'react';
import CafeHeader from './CafeHeader';
import CafeSidebar from './CafeSidebar';

interface CafeDashboardLayoutProps {
  children: React.ReactNode;
  cafeName?: string;
  ownerName?: string;
  cafeLogo?: string;
}

export default function CafeDashboardLayout({ children, cafeName, ownerName, cafeLogo }: CafeDashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans">
      <CafeHeader 
        cafeName={cafeName} 
        ownerName={ownerName} 
        cafeLogo={cafeLogo} 
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
