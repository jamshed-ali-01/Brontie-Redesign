import React from 'react';
import { Ticket, MessageSquare, ArrowRight } from 'lucide-react';
import { Lobster } from 'next/font/google';

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export function ValidateVoucherBlock() {
  return (
    <div className="mb-6 mt-4">
      <h2 className={`text-[28px] text-[#1c1c1c] tracking-tight mb-2 ${lobster.className}`}>
        Validate Voucher Code
      </h2>
      <p className="text-[11px] font-medium text-[#6ca3a4] mb-5">
        If a customer's phone camera won't open, note the voucher code on the screen and enter it here
      </p>
      
      <div className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-50 p-6">
        <form className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-gray-600 tracking-wider uppercase">Voucher Code</label>
              <span className="text-[8px] uppercase tracking-wider font-bold text-[#6ca3a4] bg-[#e0f2f1] px-2 py-0.5 rounded">
                This Voucher is ready to redeem
              </span>
            </div>
            <div className="flex-1 w-full bg-[#f8f9fa] rounded-xl flex items-center px-4 h-12 border border-gray-100 focus-within:border-[#6ca3a4] transition-colors">
              <Ticket className="w-5 h-5 text-gray-800 mr-3 stroke-[1.5]" />
              <input 
                type="text" 
                placeholder="E.G. BRONTIE2024" 
                className="bg-transparent border-none outline-none text-sm text-gray-800 font-medium placeholder:text-gray-400 w-full tracking-wide"
              />
            </div>
          </div>
          <button type="button" className="w-full md:w-auto self-start mt-2 bg-[#6ca3a4] hover:bg-[#568586] text-white px-6 h-11 rounded-xl text-[12px] font-bold transition-colors flex items-center justify-center shadow-sm">
            Validate Voucher
            <ArrowRight className="w-4 h-4 ml-2 stroke-[2]" />
          </button>
        </form>
      </div>
    </div>
  );
}

export function FeedbackBlock() {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-50 p-6 relative">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#fffbf0] border border-[#fde6b3]">
           <MessageSquare className="w-5 h-5 text-[#f4c24d] stroke-[1.5]" />
        </div>
        <h3 className="text-[13px] tracking-wide font-bold text-gray-900">Send Feedback to Brontie</h3>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">
          Your Message
        </label>
        <textarea 
          placeholder="How can we make Brontie better for your café?"
          className="w-full bg-[#fffbf0] rounded-xl p-4 text-sm text-gray-800 placeholder:text-gray-400 border border-transparent focus:border-[#f4c24d] outline-none min-h-[100px] resize-none"
        ></textarea>
        
        <button type="button" className="w-full bg-[#f4c24d] hover:bg-[#e5b54d] text-gray-900 h-12 rounded-xl text-[12px] font-bold transition-colors shadow-sm flex items-center justify-center group">
          Send Feedback
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform stroke-[2]" />
        </button>
      </div>
    </div>
  );
}
