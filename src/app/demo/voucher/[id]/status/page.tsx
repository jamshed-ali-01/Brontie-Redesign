'use client';
import React from 'react';

export default function DemoStatusPage() {
  return (
    <div className="min-h-screen bg-[#6ca3a4] p-6 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
      <div className="w-full max-w-sm bg-white rounded-[40px] p-12 flex flex-col items-center justify-center text-center space-y-8 shadow-2xl">
        <div className="w-32 h-32 bg-[#6ca3a4]/10 rounded-full flex items-center justify-center text-6xl shadow-inner border-2 border-dashed border-[#6ca3a4]/20 animate-bounce">
          ✨
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-black text-[#6ca3a4] uppercase leading-tight tracking-tighter">
            Voucher <br/> Redeemed!
          </h1>
          <p className="text-[#2c3e50]/60 font-medium text-sm">Now look back at your computer screen to see the live update.</p>
        </div>
        <div className="w-full h-[1px] bg-gray-100" />
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Powered by Brontie Demo</p>
      </div>

      <button 
        onClick={() => window.close()}
        className="px-10 h-14 bg-white/20 hover:bg-white/30 text-white font-black uppercase text-xs rounded-2xl transition-all"
      >
        Close Demo
      </button>
    </div>
  );
}
