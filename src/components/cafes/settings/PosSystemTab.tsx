'use client';

import React from 'react';
import Link from 'next/link';
import { Lobster } from 'next/font/google';

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

interface PosSystemTabProps {
  isSquareConfigured: boolean;
  onConnectSquare: () => void;
}

export default function PosSystemTab({ isSquareConfigured, onConnectSquare }: PosSystemTabProps) {
  return (
    <div className="bg-white rounded-[24px] p-8 max-w-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <h3 className={`text-[28px] text-gray-900 mb-3 ${lobster.className}`}>
        Connect your POS System
      </h3>
      
      <p className="text-[#282828] text-sm leading-relaxed mb-8">
        Brontie works using QR redemption at the counter. Connecting your POS system is
        optional and simply logs those redemptions automatically in your till.
        <br />
        <span className="text-[#94A3B8] text-sm mt-3 inline-block">
          Your Brontie dashboard and payout reports are based on vouchers redeemed via QR.
        </span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Square App */}
        <div className="bg-[#FDF5EA] rounded-2xl p-8 flex flex-col items-center justify-center border border-[#fef6eb] aspect-square transition-transform hover:scale-105">
          <div className="flex-1 flex items-center justify-center">
            <img src="/images/pos/square.png" alt="Square" className="object-contain" onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/commons/3/30/Square_Inc._logo.svg';
            }} />
          </div>
          {isSquareConfigured ? (
            <div className="px-6 py-2.5 bg-green-100 text-green-700 rounded-xl font-bold text-sm w-full text-center">
              Connected ✓
            </div>
          ) : (
            <button 
              onClick={onConnectSquare}
              className="w-full bg-[#f4c24d] text-gray-900 px-6 py-2.5 rounded-xl hover:bg-[#e5b54d] transition-colors font-bold text-sm flex items-center justify-center shadow-sm"
            >
              Connect <span className="ml-2 text-lg leading-none">→</span>
            </button>
          )}
        </div>

        {/* Clover App */}
        <div className="bg-[#FDF5EA] rounded-2xl p-8 flex flex-col items-center justify-center border border-gray-50 aspect-square transition-transform hover:scale-105">
          <div className="flex-1 flex items-center justify-center">
            <img src="/images/pos/clover.png" alt="Clover" className="object-contain" onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Clover_Network_Logo.svg/1024px-Clover_Network_Logo.svg.png';
            }} />
          </div>
          <button 
            className="w-full bg-[#f4c24d] text-gray-900 px-6 py-2.5 rounded-xl hover:bg-[#e5b54d] transition-colors font-bold text-sm flex items-center justify-center shadow-sm"
          >
            Connect <span className="ml-2 text-lg leading-none">→</span>
          </button>
        </div>

        {/* Toast App */}
        <div className="bg-[#FDF5EA] rounded-2xl p-8 flex flex-col items-center justify-center border border-orange-50 aspect-square transition-transform hover:scale-105">
          <div className="flex-1 flex items-center justify-center">
            <img src="/images/pos/toast.png" alt="Toast" className="object-contain" onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/Toast%2C_Inc._logo.svg/1200px-Toast%2C_Inc._logo.svg.png';
            }} />
          </div>
          <button 
            className="w-full bg-[#f4c24d] text-gray-900 px-6 py-2.5 rounded-xl hover:bg-[#e5b54d] transition-colors font-bold text-sm flex items-center justify-center shadow-sm"
          >
            Connect <span className="ml-2 text-lg leading-none">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
