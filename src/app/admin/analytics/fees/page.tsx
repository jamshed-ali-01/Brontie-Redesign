'use client';

import { useState, useEffect } from 'react';
import AnalyticsFilters from '@/components/admin/AnalyticsFilters';
import SummaryCard from '@/components/admin/SummaryCard';

interface FeesData {
  byMerchant: Array<{
    merchantId: string;
    merchantName: string;
    totalGross: number;
    totalStripeFees: number;
    totalBrontieFees: number;
    netToCafe: number;
    voucherCount: number;
    stripeFeePercentage: number;
    brontieFeePercentage: number;
    netToCafePercentage: number;
  }>;
  overallTotals: {
    totalGross: number;
    totalStripeFees: number;
    totalBrontieFees: number;
    netToCafe: number;
    voucherCount: number;
    stripeFeePercentage: number;
    brontieFeePercentage: number;
    netToCafePercentage: number;
  };
}

export default function FeesPage() {
  const [selectedMerchantId, setSelectedMerchantId] = useState('');
  const [dateFrom, setDateFrom] = useState('2025-09-26');
  const [dateTo, setDateTo] = useState('');
  const [data, setData] = useState<FeesData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedMerchantId) params.append('merchantId', selectedMerchantId);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await fetch(`/api/cafes/analytics/fees?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching fees data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMerchantId, dateFrom, dateTo]);

  const clearFilters = () => {
    setSelectedMerchantId('');
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
            💸 Fees Breakdown
          </h1>
          <p className="text-gray-600">
            Stripe fees, Brontie fees, and Net to Café - Transparent fee structure.
          </p>
        </div>

        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          💸 Fees Breakdown
        </h1>
        <p className="text-gray-600">
          Stripe fees, Brontie fees, and Net to Café - Transparent fee structure.
        </p>
      </div>

      <AnalyticsFilters
        selectedMerchantId={selectedMerchantId}
        onMerchantChange={setSelectedMerchantId}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        onClearFilters={clearFilters}
      />

      {data && (
        <>
          {/* Overall Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SummaryCard
              title="Total Gross Revenue"
              value={formatCurrency(data.overallTotals.totalGross)}
              description={`From ${data.overallTotals.voucherCount} vouchers`}
              icon="💰"
              bgColor="bg-gradient-to-br from-green-50 to-emerald-50"
              textColor="text-green-800"
            />
            <SummaryCard
              title="Stripe Fees"
              value={formatCurrency(data.overallTotals.totalStripeFees)}
              description={`${data.overallTotals.stripeFeePercentage.toFixed(1)}% of gross`}
              icon="🏦"
              bgColor="bg-gradient-to-br from-blue-50 to-indigo-50"
              textColor="text-blue-800"
            />
            <SummaryCard
              title="Brontie Fees"
              value={formatCurrency(data.overallTotals.totalBrontieFees)}
              description={`${data.overallTotals.brontieFeePercentage.toFixed(1)}% of gross`}
              icon="🏢"
              bgColor="bg-gradient-to-br from-yellow-50 to-orange-50"
              textColor="text-yellow-800"
            />
            <SummaryCard
              title="Net to Cafés"
              value={formatCurrency(data.overallTotals.netToCafe)}
              description={`${data.overallTotals.netToCafePercentage.toFixed(1)}% of gross`}
              icon="☕"
              bgColor="bg-gradient-to-br from-teal-50 to-cyan-50"
              textColor="text-teal-800"
            />
          </div>

          {/* Fees Breakdown Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              📊 Fees Breakdown by Café
            </h2>
            
            {data.byMerchant.length > 0 ? (
              <div className="space-y-6">
                {data.byMerchant.map((merchant) => (
                  <div key={merchant.merchantId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        ☕ {merchant.merchantName}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {merchant.voucherCount} voucher{merchant.voucherCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Gross Revenue */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Gross Revenue</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(merchant.totalGross)}
                        </span>
                      </div>
                      
                      {/* Stripe Fees */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-700">Stripe Fees ({merchant.stripeFeePercentage.toFixed(1)}%)</span>
                        <span className="text-sm font-semibold text-blue-900">
                          -{formatCurrency(merchant.totalStripeFees)}
                        </span>
                      </div>
                      
                      {/* Brontie Fees */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-yellow-700">Brontie Fees ({merchant.brontieFeePercentage.toFixed(1)}%)</span>
                        <span className="text-sm font-semibold text-yellow-900">
                          -{formatCurrency(merchant.totalBrontieFees)}
                        </span>
                      </div>
                      
                      {/* Net to Café */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="text-sm font-bold text-teal-700">Net to Café ({merchant.netToCafePercentage.toFixed(1)}%)</span>
                        <span className="text-sm font-bold text-teal-900">
                          {formatCurrency(merchant.netToCafe)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl mb-4 block">💸</span>
                <p>No fee data found for the selected period.</p>
              </div>
            )}
          </div>

          {/* Visual Representation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              📈 Fee Distribution Visualization
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm font-medium text-gray-700">Gross Revenue</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm font-medium text-gray-700">Stripe Fees (~1.4%)</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-sm font-medium text-gray-700">Brontie Fees (10% after 90 days)</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-teal-500 rounded"></div>
                <span className="text-sm font-medium text-gray-700">Net to Café (~88.6%)</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
