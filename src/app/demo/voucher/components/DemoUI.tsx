import React, { useState, useEffect } from 'react';
import { Lobster } from 'next/font/google';

const lobster = Lobster({
  subsets: ['latin'],
  weight: ['400'],
});

interface DemoButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const DemoButton = ({ onClick, disabled, className, children }: DemoButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`uppercase p-3.5 rounded-2xl text-black text-lg font-bold tracking-[-2%] w-full shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${className || 'bg-[#F4C45E]'}`}
  >
    {children}
  </button>
);

export const Overlay = ({ value }: { value: string }) => (
  <div className={`${lobster.className} absolute inset-0 bg-black/60 z-[2] flex justify-center items-center rounded-[20px]`}>
    <p className="text-6xl min-[375px]:text-[68px] leading-1 text-[#FFFFFFCC] font-normal">
      {value}
    </p>
  </div>
);

interface DemoCardProps {
  demo: any;
  buttonText?: string;
  buttonClass?: string;
  onButtonClick?: () => void;
  isLoading?: boolean;
}

export const DemoCard = ({ demo, buttonText, buttonClass, onButtonClick, isLoading, overlay }: DemoCardProps & { overlay?: React.ReactNode }) => {
  if (isLoading || !demo) {
    return (
      <div className="bg-white rounded-[30px] p-4 animate-pulse space-y-4">
        <div className="w-full h-[279px] bg-gray-200 rounded-[20px]" />
        <div className="h-6 w-3/4 bg-gray-200 rounded mx-auto" />
        <div className="h-14 w-full bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[30px] p-4 flex flex-col gap-5 shadow-2xl">
      <div className="relative w-full h-[279px] rounded-[20px] overflow-hidden bg-gray-50">
        {overlay && overlay}
        {demo.itemImage ? (
          <img
            src={demo.itemImage}
            alt={demo.itemName}
            className="w-full h-full object-cover rounded-[20px]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">☕</div>
        )}
      </div>

      <div className="px-2.5 flex flex-col gap-4 pb-1.5">
        <div className="flex items-center gap-2 capitalize justify-between">
          <p className="text-black shrink-0 font-medium">{demo.senderName}</p>
          <div className="w-full aspect-[13.625/1] min-h-1 min-[450px]:h-2 relative opacity-20">
             <img src="/images/pngs/arrow.svg" alt="arrow" className="w-full h-full object-contain" />
          </div>
          <p className="text-black shrink-0 font-medium">{demo.recipientName}</p>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-black text-2xl min-[375px]:text-3xl font-bold uppercase tracking-[-2%] text-left">
            {demo.itemName}
          </h1>
          <p className="text-black text-sm tracking-[-2%] text-left">
            Experience Brontie demo voucher. Valid at any of your checkout points.
          </p>
        </div>

        {buttonText && (
          <DemoButton onClick={onButtonClick} className={buttonClass}>
            {buttonText}
          </DemoButton>
        )}
      </div>
    </div>
  );
};
