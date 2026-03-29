'use client';

import { useState, useEffect } from 'react';
import { trackEvent } from '@/lib/posthog-tracking';

interface AnalyticsData {
  qrScans: {
    merchant: string;
    scans: number;
    sales: number;
    conversionRate: number;
  }[];
  funnelData: {
    step: string;
    users: number;
    dropoff: number;
  }[];
  redemptionDelays: {
    merchant: string;
    averageDelay: number;
  }[];
  sessionDurations: {
    merchant: string;
    averageDuration: number;
  }[];
  posthogData?: {
    qrAnalytics: {
      totalScans: number;
      uniqueUsers: number;
      scansByMerchant: Record<string, number>;
      scansByType: Record<string, number>;
    };
    funnelAnalytics: {
      qrScans: number;
      productViews: number;
      addToCart: number;
      checkout: number;
      purchases: number;
    };
  };
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMerchant, setSelectedMerchant] = useState<string>('all');

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedMerchant]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?merchant=${selectedMerchant}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleMerchantChange = (merchant: string) => {
    setSelectedMerchant(merchant);
    trackEvent('analytics_merchant_filter_changed', { merchant });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-red-200">
            <span className="text-red-500 text-2xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-700 mb-4">Error Loading Analytics</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="bg-amber-600 text-white font-bold py-2 px-6 rounded-full hover:bg-amber-700 transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">QR code performance and user journey analytics</p>
        </div>

        {/* Merchant Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Merchant
          </label>
          <select
            value={selectedMerchant}
            onChange={(e) => handleMerchantChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="all">All Merchants</option>
            <option value="generic">Generic QR Codes</option>
            {/* Add merchant options here */}
          </select>
        </div>

        {data && (
          <div className="space-y-6">
            {/* PostHog section moved to /admin/posthog */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* QR Scans & Sales */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">QR Scans & Sales</h2>
              <div className="space-y-4">
                {data.qrScans.map((item, index) => (
                  <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">{item.merchant}</span>
                      <span className="text-sm text-gray-500">{item.scans} scans</span>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-sm">
                        <span>Sales: {item.sales}</span>
                        <span>Conversion: {item.conversionRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-amber-600 h-2 rounded-full" 
                          style={{ width: `${item.conversionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Funnel Analysis */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Funnel Analysis</h2>
              <div className="space-y-4">
                {data.funnelData.map((step, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-amber-600 font-semibold text-sm">{index + 1}</span>
                        </div>
                        <span className="font-medium text-gray-700">{step.step}</span>
                      </div>
                      <div className="ml-11 text-sm text-gray-500">
                        {step.users} users ({step.dropoff.toFixed(1)}% dropoff)
                      </div>
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-amber-600 h-2 rounded-full" 
                        style={{ width: `${100 - step.dropoff}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Redemption Delays */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Redemption Delays</h2>
              <div className="space-y-4">
                {data.redemptionDelays.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">{item.merchant}</span>
                    <span className="text-sm text-gray-500">
                      {item.averageDelay.toFixed(1)} days avg
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Session Durations */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Session Durations</h2>
              <div className="space-y-4">
                {data.sessionDurations.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">{item.merchant}</span>
                    <span className="text-sm text-gray-500">
                      {item.averageDuration.toFixed(1)} min avg
                    </span>
                  </div>
                ))}
              </div>
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
