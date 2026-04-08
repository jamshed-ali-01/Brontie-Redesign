import React from 'react';
import { Ticket, MessageSquare, ArrowRight } from 'lucide-react';

export function ValidateVoucherBlock() {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-[#2c3e50] font-sans tracking-tight mb-2" style={{ fontFamily: 'var(--font-lobster), cursive' }}>
        Validate Voucher Code
      </h2>
      <p className="text-xs text-[#6ca3a4] mb-4">
        If a customer's phone camera won't open, note the voucher code on the screen and enter it here
      </p>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <form className="flex flex-col md:flex-row gap-3 items-center">
          <div className="flex-1 w-full bg-[#f8f9fa] rounded-xl flex items-center px-4 h-12 border border-gray-100 focus-within:border-gray-300 transition-colors">
            <Ticket className="w-5 h-5 text-gray-400 mr-3" />
            <input 
              type="text" 
              placeholder="E.G. BRONTIE2024" 
              className="bg-transparent border-none outline-none text-sm text-gray-800 font-medium placeholder:text-gray-400 w-full"
            />
          </div>
          <button type="button" className="w-full md:w-auto shrink-0 bg-[#6ca3a4] hover:bg-[#568586] text-white px-6 h-12 rounded-xl text-xs font-bold transition-colors flex items-center justify-center shadow-sm">
            Validate Voucher
            <ArrowRight className="w-4 h-4 ml-2 stroke-[2.5]" />
          </button>
        </form>
        <div className="mt-3 flex justify-end">
           <span className="text-[9px] uppercase tracking-wider font-bold text-[#6ca3a4] bg-[#e0f2f1] px-2 py-1 rounded">
             This Voucher is ready to redeem
           </span>
        </div>
      </div>
    </div>
  );
}

export function FeedbackBlock() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#fff9eb] border border-[#fde6b3]">
           <MessageSquare className="w-4 h-4 text-[#f4c24d] stroke-[2.5]" />
        </div>
        <h3 className="text-sm font-bold text-gray-900">Send Feedback to Brontie</h3>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">
          Your Message
        </label>
        <textarea 
          placeholder="How can we make Brontie better for your café?"
          className="w-full bg-[#fdf5e6] rounded-xl p-4 text-sm text-gray-800 placeholder:text-gray-400 border border-transparent focus:border-[#f4c24d] outline-none min-h-[100px] resize-none"
        ></textarea>
        
        <button type="button" className="w-full bg-[#f4c24d] hover:bg-[#e5b54d] text-[#2c3e50] h-12 rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center group">
          Send Feedback
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
