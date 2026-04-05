import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Lobster } from 'next/font/google';

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col font-sans overflow-hidden bg-[#fef6eb]">
      {/* Header */}
      <header className="h-[64px] bg-[#6ca3a4] relative z-50 flex items-center px-10 shrink-0">
        <Link href="/" className="inline-block relative z-10">
          <span className={`text-[#f4c24d] text-[26px] leading-none block pt-0.5 ${lobster.className}`}>Brontie</span>
        </Link>
      </header>

      {/* Main Layout Area */}
      <main className="flex-1 relative flex">
        {/* Background Visuals Container - absolute so it sits behind content */}
        <div className="absolute inset-0 pointer-events-none flex overflow-hidden">
          {/* Left Yellow Section */}
          <div className="h-full md:w-[45%] w-full bg-[#f4c24d] relative shrink-0">
            {/* Outline Coffee Beans Top Left */}
            <div className="absolute top-[8%] -left-[8%]">
              <div className="relative  size-44  ">
                <Image src="/images/onboarding/Coffee-Bean.png" alt="" fill className="filter brightness-0 object-contain opacity-60" />
              </div>
            </div>


            {/* Elegantly placed Curve - using a better positioned rounded element for a smoother arc */}
            <div className="absolute bg-[#fef6eb] max-md:top-[15%] max-md:bottom-[-10%] max-md:-left-[25%] max-md:w-[150%] max-md:rounded-t-[100%] max-md:shadow-[0_-10px_30px_rgba(0,0,0,0.02)] md:top-[-10%] md:bottom-[-10%] md:-right-[80%] md:w-[130%] md:rounded-l-[100%] md:shadow-[-10px_0_30px_rgba(0,0,0,0.02)]"></div>

            {/* Coffee Cups Heart Visualization - Bottom Left */}
            <div className="absolute bottom-[8%] left-[6%] w-[280px] h-[280px] z-10 pointer-events-none flex items-center justify-center translate-y-[10%]">
              {/* Using the Heart.svg asset for the loop */}
              <div className="absolute inset-0 scale-125">
                <Image src="/images/onboarding/Heart.png" alt="" fill className="object-contain " />
              </div>


            </div>
          </div>

          {/* Right Cream Section */}
          <div className="flex-1 bg-[#fef6eb]"></div>
        </div>

        {/* Content Container - sits above the background layer */}
        <div className="relative z-10 w-full flex items-center justify-end md:justify-center p-6 md:p-8 min-h-full">
          <div className="w-full max-w-[640px] md:pl-[8%] lg:pl-[12%] pt-2 pb-8">
            {title && (
              <div className="text-center mb-8   mx-auto">
                <h1 className={`text-[36px] md:text-[52px] md:text-[#6ca3a4] text-black mb-1.5 ${lobster.className} leading-tight`}>{title}</h1>
                {subtitle && <p className="md:text-slate-500 text-black/90 text-xs md:text-[12px] max-w-[320px] md:max-w-[460px] mx-auto">{subtitle}</p>}
              </div>
            )}
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
