import React from 'react';
import { ArrowRight } from 'lucide-react';

interface SetupActionsProps {
  onContinue: (e?: React.FormEvent) => void;
  onBack?: () => void;
  hideBackButton?: boolean;
  isSaving?: boolean;
  continueText?: string;
  isContinueDisabled?: boolean;
  layout?: 'center' | 'split';
  maxWidth?: string;
}

export default function SetupActions({
  onContinue,
  onBack,
  hideBackButton = false,
  isSaving = false,
  continueText = 'Save & Continue',
  isContinueDisabled = false,
  layout = 'center',
  maxWidth = 'max-w-[640px]',
}: SetupActionsProps) {
  if (layout === 'split') {
    return (
      <div className={`flex flex-col items-center w-full ${maxWidth} mx-auto mt-6 pb-12 relative z-30 px-6`}>
        <div className="flex justify-between items-center w-full">
          {!hideBackButton ? (
            <button
              type="button"
              onClick={onBack}
              className="bg-white text-[#2c3e50] font-bold h-[50px] rounded-[18px] px-8 flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm border border-gray-100 active:scale-95"
            >
              <span className="text-[13px]">{hideBackButton ? '' : 'Go Back'}</span>
            </button>
          ) : (
            <div></div> // Empty div to keep flex space-between intact
          )}
          
            <button
              type="button"
              onClick={onContinue}
              disabled={isSaving || isContinueDisabled}
              className="bg-[#f4c24d] text-[#2c3e50] font-bold h-[50px] rounded-[18px] px-8 flex items-center justify-center hover:bg-[#e5b54d] transition-all shadow-md shadow-[#f4c24d]/20 active:scale-95 disabled:opacity-50"
            >
              <span className="text-[13px]">{isSaving ? 'Processing...' : continueText}</span>
            </button>
        </div>
      </div>
    );
  }

  // Default centered layout used in Step 1
  return (
     <div className={`flex flex-col items-center mt-10 mb-4 w-full relative z-30 px-6 ${maxWidth} mx-auto`}>
        <button
          type="button"
          onClick={onContinue}
          disabled={isSaving || isContinueDisabled}
          className="w-full bg-[#f4c24d] text-[#2c3e50] font-bold h-[50px] rounded-[18px] flex items-center justify-center space-x-2 hover:bg-[#e5b54d] transition-all shadow-md shadow-[#f4c24d]/20 active:scale-95 disabled:opacity-50 group"
        >
          <span className="text-[13px]">{isSaving ? 'Processing...' : continueText}</span>
          {!isSaving && <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />}
        </button>
        
        <p className="text-gray-500 text-[12px] mt-2 font-medium opacity-60">
          You can save and return anytime
        </p>

        {!hideBackButton && onBack && (
           <button 
             type="button" 
             onClick={onBack} 
             className="mt-6 text-[#2c3e50]/40 hover:text-[#2c3e50] text-[11px] font-black uppercase tracking-widest transition-all flex items-center space-x-2"
           >
             Go Back
           </button>
        )}
     </div>
  );
}
