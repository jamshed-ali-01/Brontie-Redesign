'use client';

import { useState, useEffect } from 'react';

interface AdminSummary {
  totalMerchants: number;
  totalGiftItems: number;
  totalVouchers: number;
  totalRedemptions: number;
  totalRevenue: number;
  recentVouchers?: {
    _id: string;
    giftItemName: string;
    merchantName: string;
    locationName: string;
    price: number;
    status: string;
    createdAt: string;
  }[];
  topGiftItems?: {
    _id: string;
    name: string;
    count: number;
    revenue: number;
  }[];
  topMerchants?: {
    _id: string;
    name: string;
    voucherCount: number;
    redemptionCount: number;
    revenue: number;
  }[];
}

export default function AdminPage() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'all' | 'month' | 'week'>('all');

  useEffect(() => {
    const defaultSummary: AdminSummary = {
      totalMerchants: 0,
      totalGiftItems: 0,
      totalVouchers: 0,
      totalRedemptions: 0,
      totalRevenue: 0,
      recentVouchers: [],
      topGiftItems: [],
      topMerchants: []
    };

    const fetchAdminSummary = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/summary?timeframe=${timeframe}`);
        if (!response.ok) {
          throw new Error('Failed to fetch admin summary');
        }
        const data = await response.json();
        setSummary(data);
      } catch (error) {
        console.error('Error fetching admin summary:', error);
        setSummary(defaultSummary);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminSummary();
  }, [timeframe]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">Failed to load admin data</div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setTimeframe('week')}
            className={`px-3 py-1 rounded-lg text-sm ${
              timeframe === 'week' 
                ? 'bg-amber-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            This Week
          </button>
          <button 
            onClick={() => setTimeframe('month')}
            className={`px-3 py-1 rounded-lg text-sm ${
              timeframe === 'month' 
                ? 'bg-amber-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            This Month
          </button>
          <button 
            onClick={() => setTimeframe('all')}
            className={`px-3 py-1 rounded-lg text-sm ${
              timeframe === 'all' 
                ? 'bg-amber-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Time
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-amber-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Merchants</h3>
          <p className="text-2xl font-bold">{summary.totalMerchants}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-amber-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Gift Items</h3>
          <p className="text-2xl font-bold">{summary.totalGiftItems}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-amber-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Vouchers</h3>
          <p className="text-2xl font-bold">{summary.totalVouchers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-amber-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
          <p className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</p>
        </div>
      </div>
      
      {/* Top Gift Items */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Top Gift Items</h2>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-amber-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-amber-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gift Item
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vouchers
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(!summary.topGiftItems || summary.topGiftItems.length === 0) ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                    No gift items data available
                  </td>
                </tr>
              ) : (
                summary.topGiftItems.map((item) => (
                  <tr key={item._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.count}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(item.revenue)}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Top Merchants */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Top Merchants</h2>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-amber-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-amber-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Merchant
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vouchers
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Redemptions
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(!summary.topMerchants || summary.topMerchants.length === 0) ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No merchants data available
                  </td>
                </tr>
              ) : (
                summary.topMerchants.map((merchant) => (
                  <tr key={merchant._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{merchant.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{merchant.voucherCount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{merchant.redemptionCount}</div>
                      <div className="text-xs text-gray-500">
                        {merchant.voucherCount > 0 
                          ? `${Math.round((merchant.redemptionCount / merchant.voucherCount) * 100)}%` 
                          : '0%'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(merchant.revenue)}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Recent Vouchers */}
      <div>
        <h2 className="text-xl font-bold mb-4">Recent Vouchers</h2>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-amber-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-amber-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gift Item
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Merchant
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(!summary.recentVouchers || summary.recentVouchers.length === 0) ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No recent vouchers
                  </td>
                </tr>
              ) : (
                summary.recentVouchers.map((voucher) => (
                  <tr key={voucher._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{voucher.giftItemName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{voucher.merchantName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{voucher.locationName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(voucher.price)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        voucher.status === 'redeemed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {voucher.status === 'redeemed' ? 'Redeemed' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(voucher.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
