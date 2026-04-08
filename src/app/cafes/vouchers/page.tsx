'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Lobster } from 'next/font/google';
import CafeDashboardLayout from '@/components/cafes/layout/CafeDashboardLayout';
import VouchersTabs, { VoucherTabAction } from '@/components/cafes/vouchers/VouchersTabs';
import VouchersFilterBar, { FilterState } from '@/components/cafes/vouchers/VouchersFilterBar';
import VouchersTable, { VoucherRow } from '@/components/cafes/vouchers/VouchersTable';

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

// Helper to format date "28 Feb · 4:12pm"
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  const day = d.getDate();
  const month = d.toLocaleString('en-US', { month: 'short' });
  const time = d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(' ', '');
  return `${day} ${month} · ${time}`;
}

export default function VouchersPage() {
  const [activeTab, setActiveTab] = useState<VoucherTabAction>('active');
  
  const [activeVouchers, setActiveVouchers] = useState<any[]>([]);
  const [redeemedVouchers, setRedeemedVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [merchantData, setMerchantData] = useState<any>(null);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    product: 'all',
    dateRange: 'this_month',
    sortBy: 'newest'
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/cafes/voucher-details').then(res => res.json()),
      fetch('/api/cafes/profile').then(res => res.json())
    ]).then(([voucherData, profileData]) => {
      setActiveVouchers(voucherData.activeVouchers || []);
      setRedeemedVouchers(voucherData.redeemedVouchers || []);
      setMerchantData(profileData);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching data', err);
      setLoading(false);
    });
  }, []);

  // Filter Algorithm
  const displayedVouchers = useMemo(() => {
    const rawData = activeTab === 'active' ? activeVouchers : redeemedVouchers;
    
    let filtered = [...rawData];

    // 1. Search (Code or Name)
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(v => 
        (v.code && v.code.toLowerCase().includes(q)) ||
        (v.giftItemName && v.giftItemName.toLowerCase().includes(q)) ||
        (v.recipientName && v.recipientName.toLowerCase().includes(q))
      );
    }

    // 2. Product filter
    if (filters.product !== 'all') {
      if (filters.product === 'coffee') {
        filtered = filtered.filter(v => 
          v.giftItemName?.toLowerCase().includes('coffee') && 
          !v.giftItemName?.toLowerCase().includes('cake')
        );
      } else if (filters.product === 'coffee_cake') {
        filtered = filtered.filter(v => 
          v.giftItemName?.toLowerCase().includes('cake') && 
          v.giftItemName?.toLowerCase().includes('coffee')
        );
      } else if (filters.product === 'any_other') {
        filtered = filtered.filter(v => {
          const name = v.giftItemName?.toLowerCase() || '';
          return !name.includes('coffee');
        });
      }
    }

    // 3. Date Range
    if (filters.dateRange !== 'all_time') {
      const now = new Date();
      filtered = filtered.filter(v => {
        const d = new Date(v.purchaseDate || Date.now());
        if (filters.dateRange === 'last_7_days') {
          return (now.getTime() - d.getTime()) <= 7 * 24 * 60 * 60 * 1000;
        } else if (filters.dateRange === 'this_month') {
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        } else if (filters.dateRange === 'last_month') {
          const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
          const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
          return d.getMonth() === lastMonth && d.getFullYear() === year;
        }
        return true;
      });
    }

    // 4. Sort By
    filtered.sort((a, b) => {
      const dateA = new Date(a.purchaseDate).getTime();
      const dateB = new Date(b.purchaseDate).getTime();
      const valA = Number(a.giftItemPrice) || 0;
      const valB = Number(b.giftItemPrice) || 0;

      switch(filters.sortBy) {
        case 'oldest': return dateA - dateB;
        case 'value_high': return valB - valA;
        case 'value_low': return valA - valB;
        case 'redemption_first': return new Date(a.redemptionDate || 0).getTime() - new Date(b.redemptionDate || 0).getTime();
        case 'redemption_last': return new Date(b.redemptionDate || 0).getTime() - new Date(a.redemptionDate || 0).getTime();
        case 'newest': 
        default: return dateB - dateA;
      }
    });

    // Map to VoucherRow format expected by Table
    return filtered.map((v): VoucherRow => ({
      id: v._id,
      itemName: v.giftItemName || 'Unknown Item',
      itemImage: v.giftItemImage || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80',
      value: Number(v.giftItemPrice) || 0,
      location: v.location || merchantData?.name || 'Main Cafe',
      purchaseDate: formatDate(v.purchaseDate),
      redemptionDate: activeTab === 'redeemed' ? formatDate(v.redemptionDate) : '-',
      code: v.code || 'N/A'
    }));

  }, [activeVouchers, redeemedVouchers, activeTab, filters, merchantData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#6ca3a4] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <CafeDashboardLayout cafeName={merchantData?.name || "Cafe"} ownerName={merchantData?.payoutDetails?.accountHolderName || "Admin"}>
      <div className="flex flex-col">
        {/* Header Section */}
        <h1 className={`text-[42px] text-[#6ca3a4] mb-2 ${lobster.className}`}>Vouchers</h1>
        <p className="text-[14px] font-medium text-[#879bb1] mb-2">Track and manage all coffee gift vouchers for your café</p>
        
        {/* Sub-Navigation Tabs */}
        <VouchersTabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* Filter Bar */}
        <VouchersFilterBar filters={filters} onChange={setFilters} />
        
        {/* Data Table */}
        <VouchersTable data={displayedVouchers} />
      </div>
    </CafeDashboardLayout>
  );
}
