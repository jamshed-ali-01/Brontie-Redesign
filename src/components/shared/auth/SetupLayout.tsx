'use client';

import React from 'react';
import Link from 'next/link';
import { Lobster } from 'next/font/google';
import { Coffee } from 'lucide-react';

import SetupProgress from './SetupProgress';
import SetupActions from './SetupActions';
import Image from 'next/image';

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

interface SetupLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps?: number;
  stepName: string;
  headingPart1?: string;
  headingPart2?: string;
  inlineHeading?: boolean;
  hideProgress?: boolean;
  subtitle?: string;
  onBack?: () => void;
  onContinue?: (e?: React.FormEvent) => void;
  isSaving?: boolean;
  isContinueDisabled?: boolean;
  continueText?: string;
  hideBackButton?: boolean;
  maxWidth?: string;
  buttonLayout?: 'center' | 'split';
}

export default function SetupLayout({
  children,
  currentStep,
  totalSteps = 6,
  stepName,
  headingPart1,
  headingPart2,
  inlineHeading = true,
  hideProgress = false,
  subtitle,
  onBack,
  onContinue,
  isSaving = false,
  isContinueDisabled = false,
  continueText = 'Save & Continue',
  hideBackButton = false,
  maxWidth = 'max-w-xl',
  buttonLayout = 'center'
}: SetupLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col font-sans overflow-x-hidden bg-[#f4c24d]">
      {/* Header */}
     <header className="h-[64px] bg-[#6ca3a4] relative z-50 flex items-center px-10 shrink-0">
        <Link href="/" className="relative w-[160px] h-[42px] block">
          <Image src="/images/logo-main.svg" alt="Brontie" fill className="object-contain object-left" /> 
        </Link>
      </header>


      {/* Main Content with Branded Background */}
      <main className="flex-1 relative flex flex-col items-center">
        
        {/* Giant Cream Dome rising from the bottom */}
        {/* Placed at a fixed top margin to ensure the curve intersects right under the subtitle */}
        <div className="absolute top-[265px] left-[50%] -translate-x-1/2 w-[320%] md:w-[200%] md:h-[3000px] h-full bg-[#fef6eb] rounded-t-[100%] z-0 rounded-b-none"></div>

        {/* Decorative coffee beans on the left edge */}
        <div className="absolute top-[160px] left-[-40px] opacity-[0.25] pointer-events-none rotate-[-15deg] z-10">
           {/* Custom coffee beans placeholder representing the pattern */}
           <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[120px] h-[120px] md:w-[180px] md:h-[180px]">
              <ellipse cx="60" cy="50" rx="40" ry="25" transform="rotate(-30 60 50)" stroke="white" strokeWidth="4" />
              <path d="M 30 50 Q 60 20 90 50" stroke="white" strokeWidth="4" />
              <ellipse cx="50" cy="130" rx="45" ry="28" transform="rotate(20 50 130)" stroke="white" strokeWidth="4" />
              <path d="M 20 120 Q 50 130 80 140" stroke="white" strokeWidth="4" />
              <ellipse cx="130" cy="110" rx="35" ry="22" transform="rotate(-15 130 110)" stroke="white" strokeWidth="4" />
              <path d="M 100 110 Q 130 90 160 110" stroke="white" strokeWidth="4" />
           </svg>
        </div>

        {/* Content Section */}
        <div className={`relative z-20 w-full ${maxWidth} px-7 pt-10 flex flex-col items-center`}>
           
           {/* Extracted Setup Progress Component */}
           {!hideProgress && (
             <SetupProgress 
               currentStep={currentStep} 
               totalSteps={totalSteps} 
               stepName={stepName} 
             />
           )}

           {/* Title Section - Perfectly on Yellow */}
            {(headingPart1 || headingPart2) && (
              <div className="text-center mb-6 md:mb-10 px-8 relative z-30">
                 <h1 className={`text-[32px] md:text-[42px] leading-[1.2] ${lobster.className} drop-shadow-sm text-center ${inlineHeading ? 'md:whitespace-nowrap whitespace-normal' : 'flex flex-col items-center justify-center'}`}>
                    {headingPart1 && <span className={`text-white ${inlineHeading ? 'relative inline-block mr-2.5' : 'mb-1'}`}>{headingPart1}</span>}
                    {headingPart2 && <span className={`text-[#2c3e50] ${inlineHeading ? 'relative inline-block' : ''}`}>{headingPart2}</span>}
                 </h1>
                 {subtitle && (
                   <p className="text-black text-[11px] md:text-[12px] font-medium max-w-md mx-auto mt-3 leading-relaxed opacity-90">
                     {subtitle}
                   </p>
                 )}
              </div>
            )}

           {/* Main Body Slot */}
           <div className="w-full relative z-30">
              {children}
           </div>
        </div>
        
        {/* Action Buttons extracted directly onto the beige background */}
        {onContinue && (
          <SetupActions 
            onContinue={onContinue}
            onBack={onBack}
            hideBackButton={hideBackButton}
            isSaving={isSaving}
            continueText={continueText}
            isContinueDisabled={isContinueDisabled}
            layout={buttonLayout}
            maxWidth={maxWidth}
          />
        )}
      </main>
    </div>
  );
}
