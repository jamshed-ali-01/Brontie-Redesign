'use client';

import { useState, useEffect } from 'react';
import SummaryCard from '@/components/admin/SummaryCard';

interface MasterRevenueData {
  byMerchant: Array<{
    merchantId: string;
    merchantName: string;
    merchantStatus: string;
    totalRevenue: number;
    totalGrossRevenue: number;
    redeemedRevenue: number;
    totalStripeFees: number;
    totalBrontieFees: number;
    netToCafe: number;
    brontieNetRevenue: number;
    totalVoucherCount: number;
    voucherCount: number;
    redeemedVoucherCount: number;
    stripeFeePercentage: number;
    brontieFeePercentage: number;
    netToCafePercentage: number;
    daysSinceCreation: number;
    shouldApplyCommission: boolean;
  }>;
  overall: {
    totalRevenue: number;
    totalGrossRevenue: number;
    redeemedRevenue: number;
    totalStripeFees: number;
    totalBrontieFees: number;
    netToCafe: number;
    brontieNetRevenue: number;
    totalVoucherCount: number;
    voucherCount: number;
    redeemedVoucherCount: number;
    stripeFeePercentage: number;
    brontieFeePercentage: number;
    netToCafePercentage: number;
  };
}

export default function MasterRevenuePage() {
  const [dateFrom, setDateFrom] = useState('2025-09-26');
  const [dateTo, setDateTo] = useState('');
  const [data, setData] = useState<MasterRevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await fetch(`/api/admin/master-revenue?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching master revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateFrom, dateTo]);

  const clearFilters = () => {
    setDateFrom('2025-09-26');
    setDateTo('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            💰 Master Revenue Dashboard
          </h1>
          <p className="text-gray-600">
            Revenue split by café with detailed breakdown.
          </p>
        </div>

        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          💰 Master Revenue Dashboard
        </h1>
        <p className="text-gray-600">
          Revenue split by café with detailed breakdown.
        </p>
      </div>

      {/* Date Range Filter */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          📅 Date Range Filter
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-400">📅</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-400">📅</span>
              </div>
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {data && (
        <>
          {/* Overall Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              💰 Overall Summary
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <SummaryCard
                title="Total Revenue"
                value={formatCurrency(data.overall.totalRevenue)}
                description={`From ${data.overall.totalVoucherCount} vouchers`}
                icon="💰"
                bgColor="bg-gradient-to-br from-blue-50 to-indigo-50"
                textColor="text-blue-800"
              />
              <SummaryCard
                title="Redeemed Revenue"
                value={formatCurrency(data.overall.redeemedRevenue)}
                description={`From ${data.overall.redeemedVoucherCount} vouchers`}
                icon="💳"
                bgColor="bg-gradient-to-br from-green-50 to-emerald-50"
                textColor="text-green-800"
              />
              <SummaryCard
                title="Stripe Fees"
                value={formatCurrency(data.overall.totalStripeFees)}
                description={`${data.overall.stripeFeePercentage.toFixed(1)}% of gross`}
                icon="🏦"
                bgColor="bg-gradient-to-br from-red-50 to-pink-50"
                textColor="text-red-800"
              />
              <SummaryCard
                title="Brontie Fees"
                value={formatCurrency(data.overall.totalBrontieFees)}
                description={`${data.overall.brontieFeePercentage.toFixed(1)}% of gross`}
                icon="🏢"
                bgColor="bg-gradient-to-br from-yellow-50 to-orange-50"
                textColor="text-yellow-800"
              />
              <SummaryCard
                title="Net to Cafés"
                value={formatCurrency(data.overall.netToCafe)}
                description={`${data.overall.netToCafePercentage.toFixed(1)}% of gross`}
                icon="☕"
                bgColor="bg-gradient-to-br from-teal-50 to-cyan-50"
                textColor="text-teal-800"
              />
            </div>
          </div>

          {/* Revenue by Café */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              🏪 Revenue by Café
            </h2>
            
            {data.byMerchant.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Café
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vouchers Redeemed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gross Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stripe Fees
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Brontie Fees
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net to Café
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Brontie Net Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.byMerchant.map((merchant) => (
                      <tr key={merchant.merchantId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              ☕ {merchant.merchantName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {merchant.merchantStatus === 'approved' ? '✅ Approved' : '⏳ Pending'}
                              {!merchant.shouldApplyCommission && (
                                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                  No commission (new)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          {formatCurrency(merchant.totalRevenue)}
                          <div className="text-xs text-gray-500">
                            From {merchant.totalVoucherCount} vouchers
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {merchant.voucherCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          {formatCurrency(merchant.totalGrossRevenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">
                          {formatCurrency(merchant.totalStripeFees)}
                          <div className="text-xs text-gray-500">
                            ({merchant.stripeFeePercentage.toFixed(1)}%)
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-900">
                          {formatCurrency(merchant.totalBrontieFees)}
                          <div className="text-xs text-gray-500">
                            ({merchant.brontieFeePercentage.toFixed(1)}%)
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-teal-900 font-semibold">
                          {formatCurrency(merchant.netToCafe)}
                          <div className="text-xs text-gray-500">
                            ({merchant.netToCafePercentage.toFixed(1)}%)
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-900 font-semibold">
                          {formatCurrency(merchant.brontieNetRevenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl mb-4 block">💰</span>
                <p>No revenue data found for the selected period.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
