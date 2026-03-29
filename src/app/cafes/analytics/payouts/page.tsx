'use client';

import { useEffect, useState } from 'react';
import CafeAnalyticsFilters from '@/components/cafes/CafeAnalyticsFilters';
import SummaryCard from '@/components/admin/SummaryCard';

interface PayoutData {
  totals: {
    pending: { count: number; amount: number };
    paid: { count: number; amount: number };
    reversed: { count: number; amount: number };
    pendingRedemption?: { count: number; amount: number };
  };
  recentPayouts: Array<{ amountPayable: number; paidOutAt: string; merchantName: string; voucherId: string }>;
  payoutBreakdown: Array<{ _id: string; count: number; totalAmount: number }>;
}

export default function CafePayoutsPage() {
  const [dateFrom, setDateFrom] = useState('2025-09-26');
  const [dateTo, setDateTo] = useState('');
  const [data, setData] = useState<PayoutData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      const response = await fetch(`/api/cafes/analytics/payouts?${params}`);
      const result = await response.json();
      if (result.success) setData(result.data);
    } catch (err) {
      console.error('Error loading payouts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [dateFrom, dateTo]);

  const clearFilters = () => {
    setDateFrom('2025-09-26');
    setDateTo('');
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-IE', { year: 'numeric', month: 'short', day: 'numeric' });

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">💰 Net Payable: Available vs Paid</h1>
          <p className="text-gray-600">Track your pending payouts and completed payments.</p>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">💰 Net Payable: Available vs Paid</h1>
        <p className="text-gray-600">Track your pending payouts and completed payments.</p>
      </div>

      <CafeAnalyticsFilters
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        onClearFilters={clearFilters}
      />

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SummaryCard title="Available Payments" value={formatCurrency(data.totals.pending.amount)} description={`${data.totals.pending.count} redeemed and ready to pay`} icon="✅" bgColor="bg-gradient-to-br from-green-50 to-emerald-50" textColor="text-green-800" />
            <SummaryCard title="Paid Out" value={formatCurrency(data.totals.paid.amount)} description={`${data.totals.paid.count} items completed`} icon="✅" bgColor="bg-gradient-to-br from-green-50 to-emerald-50" textColor="text-green-800" />
            <SummaryCard title="Paid but not redeemed" value={formatCurrency(data.totals.pendingRedemption?.amount || 0)} description={`${data.totals.pendingRedemption?.count || 0} items pending redemption`} icon="⏳" bgColor="bg-gradient-to-br from-yellow-50 to-amber-50" textColor="text-yellow-800" />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">📋 Recent Payouts</h2>
            {data.recentPayouts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Café</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voucher ID</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.recentPayouts.map((payout, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{payout.merchantName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{formatCurrency(payout.amountPayable)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(payout.paidOutAt)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{payout.voucherId.substring(0,8)}...</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500"><span className="text-4xl mb-4 block">💰</span>No recent payouts found.</div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">📊 Payout Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.payoutBreakdown.map(item => (
                <div key={item._id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 capitalize">{item._id}</h3>
                    <span className="text-2xl font-bold text-gray-900">{formatCurrency(item.totalAmount)}</span>
                  </div>
                  <p className="text-sm text-gray-600">{item.count} payout{item.count !== 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}


