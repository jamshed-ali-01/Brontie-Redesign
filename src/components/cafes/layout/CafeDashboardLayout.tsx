import React from 'react';
import CafeHeader from './CafeHeader';
import CafeSidebar from './CafeSidebar';

interface CafeDashboardLayoutProps {
  children: React.ReactNode;
  cafeName?: string;
  ownerName?: string;
  cafeLogo?: string;
}

export default function CafeDashboardLayout({ children, cafeName, ownerName, cafeLogo }: CafeDashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans">
      <CafeHeader cafeName={cafeName} ownerName={ownerName} cafeLogo={cafeLogo} />
      <CafeSidebar />
      <main className="lg:pl-[260px] pt-[64px] min-h-screen pb-12">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
