import React from 'react';

interface SetupProgressProps {
  currentStep: number;
  totalSteps?: number;
  stepName: string;
}

export default function SetupProgress({ currentStep, totalSteps = 6, stepName }: SetupProgressProps) {
  return (
    <div className="w-full max-w-[640px] mx-auto flex flex-col items-start md:mb-14 mb-8 px-1 relative z-30">
      <div className="flex items-end justify-between w-full mb-3">
         <div className="flex flex-col">
            <span className="text-[10px] font-black text-[#2c3e50]/80 uppercase tracking-widest mb-0.5">Setup Progress</span>
            <span className="text-[14px] font-black text-[#2c3e50] uppercase tracking-wide">{stepName}</span>
         </div>
         <span className="text-[10px] font-bold text-[#2c3e50]/80 mb-0.5">Step {currentStep} of {totalSteps}</span>
      </div>
      <div className="flex w-full gap-2">
         {Array.from({ length: totalSteps }).map((_, i) => (
            <div 
              key={i} 
              className={`h-[5px] flex-1 rounded-full transition-all duration-700 ${
                i + 1 <= currentStep ? 'bg-[#6CA3A4]' : 'bg-white'
              }`} 
            />
         ))}
      </div>
    </div>
  );
}
