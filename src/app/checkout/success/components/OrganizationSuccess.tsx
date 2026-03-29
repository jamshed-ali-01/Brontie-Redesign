'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Lobster } from 'next/font/google';

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
});

// GA4 helper function
const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).dataLayer) {
    (window as any).dataLayer.push({
      event: eventName,
      ...params,
    });
  }
};

interface Voucher {
  giftItemId?: {
    name?: string;
    price?: number;
    imageUrl?: string;
    merchantId?: {
      name?: string;
    };
  };
  organizationId?: {
    name?: string;
    logoUrl?: string;
    coverImageUrl?: string; // ✅ NEW
  };
  senderName?: string;
  message?: string;
  merchantName?: string;
}

export default function OrganizationSuccess({ vouchers }: { vouchers: any[] }) {
  const masterVoucher = vouchers[0];
  const qty = vouchers.length;
  const basePrice = masterVoucher.giftItemId?.price || 0;
  const baseTotal = basePrice * qty;
  const total = baseTotal;

  // 🔥 Track org gift purchase on mount
  useEffect(() => {
    trackEvent('org_gift_purchased', {
      value: total,
      currency: 'EUR',
      quantity: qty,
      item_name: masterVoucher.giftItemId?.name || 'Gift',
      merchant: masterVoucher.giftItemId?.merchantId?.name || 'Brontie',
      organisation: masterVoucher.organizationId?.name || 'Unknown',
      sender_name: masterVoucher.senderName || 'Anonymous',
    });
  }, []);

  return (
    <div className="bg-[#fef7ef] min-h-screen font-sans relative overflow-x-hidden flex flex-col">
      <div className="absolute top-20 left-0 w-32 h-64 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

      {/* Top Banner */}
      <div className="pt-28 pb-12 text-center px-4">
        <h1 className={`${lobster.className} text-5xl md:text-6xl text-gray-900 mb-1 leading-tight tracking-wide drop-shadow-sm`}>Thanks for Supporting</h1>
        <h1 className={`${lobster.className} text-5xl md:text-6xl text-gray-900 leading-tight tracking-wide drop-shadow-sm`}>our Local Community</h1>
      </div>

      {/* ✅ NEW — Org Cover Photo */}
      {masterVoucher.organizationId?.coverImageUrl && (
        <div className="max-w-[550px] mx-auto px-4 mb-8">
          <div className="relative w-full h-56 rounded-2xl overflow-hidden shadow-lg">
            <Image
              src={masterVoucher.organizationId.coverImageUrl}
              alt={masterVoucher.organizationId.name || 'Organisation'}
              fill
              className="object-cover"
            />
            {masterVoucher.organizationId.name && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
                <p className="text-white font-bold text-lg">{masterVoucher.organizationId.name}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 lg:px-0 flex-1 pb-16">
        <div className="max-w-[550px] mx-auto bg-white rounded-2xl shadow-xl overflow-hidden relative z-10 px-6 py-6">
          <div className="flex flex-col sm:flex-row gap-6 items-center">
            <div className="w-[140px] h-[140px] relative rounded-[20px] overflow-hidden flex-shrink-0 shadow-sm">
              {masterVoucher.giftItemId?.imageUrl ? (
                <Image src={masterVoucher.giftItemId.imageUrl} alt="Gift" fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-[#1b4332] flex items-center justify-center">
                  <span className="text-4xl">☕</span>
                </div>
              )}
            </div>

            <div className="flex-1 w-full flex flex-col justify-center">
              <p className="font-bold text-gray-800 mb-1 text-[15px] font-['Arial']">
                {qty} x {masterVoucher.giftItemId?.name || "Coffee"} from{' '}
                <span className={`${lobster.className} text-[19px] tracking-wide ml-1`}>
                  {masterVoucher.merchantName || masterVoucher.giftItemId?.merchantId?.name || "Typo Cafe"}
                </span>
              </p>
              <h3 className={`${lobster.className} text-[26px] text-primary-100 mb-3`}>Total : €{total.toFixed(2)}</h3>

              <div className="space-y-1.5 text-sm text-gray-800 border-t border-gray-100 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-['Arial']">
                    {masterVoucher.giftItemId?.name || "Coffee & Cake"}{' '}
                    <span className="font-bold">(€{basePrice.toFixed(2)})</span> x {qty}
                  </span>
                  <span className={`${lobster.className} font-bold text-[16px] font-['Arial']`}>€{baseTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 text-xs font-medium text-gray-600 flex flex-col gap-1 tracking-wide">
                <span className="capitalize text-gray-700 font-['Arial']">From : {masterVoucher.senderName || "Kevin"}</span>
                <span className="capitalize text-gray-700 font-['Arial']">Message : {masterVoucher.message || "Thank you for your work"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12 mb-20">
          <p className="text-gray-800 font-medium text-[15px]">Your gifts have been donated to the selected organisation.</p>
        </div>
      </div>

      <div className="relative w-full pt-16 mt-auto">
        <div className="absolute bottom-0 left-0 w-full h-[60%] bg-secondary-100 z-0"></div>

        <div className="bg-[#6ca3a4] rounded-[24px] p-8 md:p-12 max-w-[1000px] mx-auto flex flex-col md:flex-row items-center justify-between gap-12 relative z-10 mb-12 mx-4 lg:mx-auto">
          <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

          <div className="flex-1 relative z-10 text-center md:text-left text-white md:pl-4">
            <h2 className={`${lobster.className} text-[38px] md:text-[44px] mb-5 text-white leading-tight drop-shadow-sm tracking-wide`}>
              Ready To Brighten<br />Someone's Day?
            </h2>
            <p className="text-white/95 font-medium leading-relaxed max-w-[380px] mx-auto md:mx-0 text-[14px]">
              Every Small Gesture Creates Ripples Of Joy. Start With A Simple Gift And Watch How It Transforms An Ordinary Moment Into Something Memorable.
            </p>
            <Link
              href="/bulk-gifting"
              onClick={() => trackEvent('explore_gifts_clicked', { source: 'org_success_page' })}
              className="inline-block mt-8 bg-secondary-100 hover:bg-[#e6b461] text-gray-900 transition-transform hover:scale-105 font-medium text-[15px] py-3.5 px-6 rounded-xl"
            >
              Explore more gifts →
            </Link>
          </div>

          <div className="flex-[1.2] w-full relative min-h-[280px] md:min-h-[320px] hidden sm:block z-10">
            <div className="absolute top-[8%] right-[0%] w-[75%] h-[80%] bg-gray-200 rounded-[16px] overflow-hidden shadow-sm z-10 border border-black/5">
              <Image src="/images/min-banner-1.png" fill sizes="400px" className="object-cover" alt="Brontie Coffee" />
            </div>
            <div className="absolute bottom-[2%] left-[12%] w-[38%] h-[45%] bg-gray-200 rounded-[12px] overflow-hidden shadow-lg border-2 border-white/10 z-20">
              <Image src="/images/min-banner-2.png" fill sizes="200px" className="object-cover" alt="Community People" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
