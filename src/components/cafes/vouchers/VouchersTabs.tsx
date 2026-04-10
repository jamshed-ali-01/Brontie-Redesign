'use client';

import React from 'react';

export type VoucherTabAction = 'active' | 'redeemed';

interface VouchersTabsProps {
  activeTab: VoucherTabAction;
  onTabChange: (tab: VoucherTabAction) => void;
}

export default function VouchersTabs({ activeTab, onTabChange }: VouchersTabsProps) {
  const tabs = [
    { id: 'active', label: 'Active Vouchers' },
    { id: 'redeemed', label: 'Redeemed Vouchers' },
  ] as const;

  return (
    <div className="flex space-x-6 border-b border-gray-100 mb-8 mt-12 w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`pb-4 px-2 text-sm font-semibold transition-colors relative ${
            activeTab === tab.id
              ? 'text-[#f4c24d]'
              : 'text-[#879bb1] hover:text-[#425d78]'
          }`}
        >
          {tab.label}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#f4c24d] rounded-t-lg" />
          )}
        </button>
      ))}
    </div>
  );
}
