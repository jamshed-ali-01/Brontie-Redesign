'use client';

import { useState, useEffect } from 'react';
import AnalyticsFilters from '@/components/admin/AnalyticsFilters';
import SummaryCard from '@/components/admin/SummaryCard';

interface RedemptionDelayData {
  statistics: {
    count: number;
    avgDelay: number;
    medianDelay: number;
    minDelay: number;
    maxDelay: number;
    percentiles: {
      p25: number;
      p50: number;
      p75: number;
      p90: number;
    };
  };
  histogram: Array<{
    _id: string;
    count: number;
    avgAmount: number;
  }>;
}

export default function RedemptionDelayPage() {
  const [selectedMerchantId, setSelectedMerchantId] = useState('');
  const [dateFrom, setDateFrom] = useState('2024-06-14'); // First Stripe transaction date
  const [dateTo, setDateTo] = useState('');
  const [data, setData] = useState<RedemptionDelayData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedMerchantId) params.append('merchantId', selectedMerchantId);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await fetch(`/api/cafes/analytics/redemption-delay?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching redemption delay data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMerchantId, dateFrom, dateTo]);

  const clearFilters = () => {
    setSelectedMerchantId('');
    setDateFrom('');
    setDateTo('');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            ⏱️ Redemption Delay
          </h1>
          <p className="text-gray-600">
            Speed to Use - Days from issue to redeem.
          </p>
        </div>

        <div className="animate-pulse space-y-4">
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
          ⏱️ Redemption Delay
        </h1>
        <p className="text-gray-600">
          Speed to Use - Days from issue to redeem.
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
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SummaryCard
              title="Average Delay"
              value={`${data.statistics.avgDelay.toFixed(1)} days`}
              description="Mean time to redemption"
              icon="📊"
              bgColor="bg-gradient-to-br from-blue-50 to-indigo-50"
              textColor="text-blue-800"
            />
            <SummaryCard
              title="Median Delay"
              value={`${data.statistics.medianDelay.toFixed(1)} days`}
              description="50th percentile"
              icon="📈"
              bgColor="bg-gradient-to-br from-green-50 to-emerald-50"
              textColor="text-green-800"
            />
            <SummaryCard
              title="Fastest Redemption"
              value={`${data.statistics.minDelay.toFixed(1)} days`}
              description="Quickest redemption"
              icon="⚡"
              bgColor="bg-gradient-to-br from-yellow-50 to-orange-50"
              textColor="text-yellow-800"
            />
            <SummaryCard
              title="Slowest Redemption"
              value={`${data.statistics.maxDelay.toFixed(1)} days`}
              description="Longest redemption"
              icon="🐌"
              bgColor="bg-gradient-to-br from-red-50 to-pink-50"
              textColor="text-red-800"
            />
          </div>

          {/* Percentiles */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              📊 Redemption Delay Percentiles
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {data.statistics.percentiles.p25.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">25th Percentile</div>
                <div className="text-xs text-gray-500">days</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {data.statistics.percentiles.p50.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">50th Percentile</div>
                <div className="text-xs text-gray-500">days</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {data.statistics.percentiles.p75.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">75th Percentile</div>
                <div className="text-xs text-gray-500">days</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {data.statistics.percentiles.p90.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">90th Percentile</div>
                <div className="text-xs text-gray-500">days</div>
              </div>
            </div>
          </div>

          {/* Histogram */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              📈 Redemption Delay Distribution
            </h2>
            
            {data.histogram.length > 0 ? (
              <div className="space-y-4">
                {data.histogram.map((bucket, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-24 text-sm font-medium text-gray-700">
                      {bucket._id === '365+' ? '365+ days' : `${bucket._id} days`}
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
                      <div
                        className="bg-teal-600 h-8 rounded-full flex items-center justify-end pr-4"
                        style={{ 
                          width: `${Math.max((bucket.count / Math.max(...data.histogram.map(h => h.count))) * 100, 5)}%` 
                        }}
                      >
                        {bucket.count > 0 && (
                          <span className="text-white text-sm font-medium">
                            {bucket.count}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-20 text-sm text-gray-600 text-right">
                      {bucket.count} vouchers
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl mb-4 block">⏱️</span>
                <p>No redemption delay data found for the selected period.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
