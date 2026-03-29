'use client';

import { useState, useEffect } from 'react';
import AnalyticsFilters from '@/components/admin/AnalyticsFilters';
import SummaryCard from '@/components/admin/SummaryCard';
import ProgressBar from '@/components/admin/ProgressBar';

interface FunnelData {
  totals: {
    totalSold: { count: number; amount: number };
    totalRedeemed: { count: number; amount: number };
    totalRefunded: { count: number; amount: number };
    totalExpired: { count: number; amount: number };
  };
  conversionRate: number;
  statusBreakdown: Array<{
    _id: string;
    count: number;
    totalAmount: number;
  }>;
}

export default function VoucherFunnelPage() {
  const [selectedMerchantId, setSelectedMerchantId] = useState('');
  const [dateFrom, setDateFrom] = useState('2025-09-26');
  const [dateTo, setDateTo] = useState('');
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedMerchantId) params.append('merchantId', selectedMerchantId);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await fetch(`/api/cafes/analytics/funnel?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching funnel data:', error);
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
            📊 Voucher Funnel
          </h1>
          <p className="text-gray-600">
            Sold vs Redeemed vs Refunded - Track voucher lifecycle and conversion rates.
          </p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-yellow-600 mr-2">💡</span>
            <p className="text-yellow-800 font-medium">
              Note: Sold ≠ Payable. Cafés are paid when vouchers are redeemed.
            </p>
          </div>
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
          📊 Voucher Funnel
        </h1>
        <p className="text-gray-600">
          Sold vs Redeemed vs Refunded - Track voucher lifecycle and conversion rates.
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-yellow-600 mr-2">💡</span>
          <p className="text-yellow-800 font-medium">
            Note: Sold ≠ Payable. Cafés are paid when vouchers are redeemed.
          </p>
        </div>
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
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SummaryCard
              title="Total Sold"
              value={formatCurrency(data.totals.totalSold.amount)}
              description={`From ${data.totals.totalSold.count} vouchers`}
              icon="💰"
              bgColor="bg-gradient-to-br from-orange-50 to-red-50"
              textColor="text-orange-800"
            />
            <SummaryCard
              title="Total Redeemed"
              value={formatCurrency(data.totals.totalRedeemed.amount)}
              description={`From ${data.totals.totalRedeemed.count} vouchers`}
              icon="✅"
              bgColor="bg-gradient-to-br from-green-50 to-emerald-50"
              textColor="text-green-800"
            />
            <SummaryCard
              title="Total Refunded"
              value={formatCurrency(data.totals.totalRefunded.amount)}
              description={`From ${data.totals.totalRefunded.count} vouchers`}
              icon="🔄"
              bgColor="bg-gradient-to-br from-pink-50 to-rose-50"
              textColor="text-pink-800"
            />
            <SummaryCard
              title="Conversion Rate"
              value={`${data.conversionRate}%`}
              description="Sold → Redeemed"
              icon="📈"
              bgColor="bg-gradient-to-br from-teal-50 to-cyan-50"
              textColor="text-teal-800"
            />
          </div>

          {/* Voucher Status Funnel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              📊 Voucher Status Funnel
            </h2>
            
            <div className="space-y-4">
              <ProgressBar
                label="Sold"
                value={data.totals.totalSold.amount}
                maxValue={Math.max(
                  data.totals.totalSold.amount,
                  data.totals.totalRedeemed.amount,
                  data.totals.totalRefunded.amount
                )}
                color="bg-blue-600"
              />
              <ProgressBar
                label="Redeemed"
                value={data.totals.totalRedeemed.amount}
                maxValue={Math.max(
                  data.totals.totalSold.amount,
                  data.totals.totalRedeemed.amount,
                  data.totals.totalRefunded.amount
                )}
                color="bg-green-600"
              />
              <ProgressBar
                label="Refunded"
                value={data.totals.totalRefunded.amount}
                maxValue={Math.max(
                  data.totals.totalSold.amount,
                  data.totals.totalRedeemed.amount,
                  data.totals.totalRefunded.amount
                )}
                color="bg-red-600"
              />
              <ProgressBar
                label="Expired"
                value={data.totals.totalExpired.amount}
                maxValue={Math.max(
                  data.totals.totalSold.amount,
                  data.totals.totalRedeemed.amount,
                  data.totals.totalRefunded.amount
                )}
                color="bg-gray-600"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
