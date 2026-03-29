'use client';

import { useState, useEffect } from 'react';
import AnalyticsFilters from '@/components/admin/AnalyticsFilters';
import SummaryCard from '@/components/admin/SummaryCard';

interface CustomerAcquisitionData {
  viralMetrics: {
    totalRecipients: number;
    recipientsWhoBecameSenders: number;
    viralConversionRate: number;
    totalSenders: number;
    viralCoefficient: number;
  };
  
  timeSeries: Array<{
    _id: {
      year: number;
      month: number;
      day: number;
    };
    newRecipients: number;
    becameSenders: number;
    conversionRate: number;
    date: string;
  }>;
  cohortAnalysis: Array<{
    _id: string;
    totalRecipients: number;
    becameSenders: number;
    conversionRate: number;
  }>;
}

export default function CustomerAcquisitionPage() {

  const [selectedMerchantId, setSelectedMerchantId] = useState('');
  const [dateFrom, setDateFrom] = useState('2024-06-14'); // First Stripe transaction date
  const [dateTo, setDateTo] = useState('');
  const [data, setData] = useState<CustomerAcquisitionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedMerchantId) params.append('merchantId', selectedMerchantId);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await fetch(`/api/cafes/analytics/customer-acquisition?${params}`);
      
      const result = await response.json();

      console.log("result",result);
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching customer acquisition data:', error);
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
            🚀 Customer Acquisition
          </h1>
          <p className="text-gray-600">
            Viral Loop Analysis - Track growth through recipient-to-sender conversion.
          </p>
        </div>

        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
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
          🚀 Customer Acquisition
        </h1>
        <p className="text-gray-600">
          Viral Loop Analysis - Track growth through recipient-to-sender conversion.
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
          {/* Viral Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <SummaryCard
              title="Total Recipients"
              value={data.viralMetrics.totalRecipients.toLocaleString()}
              description="People who received gifts"
              icon="🎁"
              bgColor="bg-gradient-to-br from-blue-50 to-indigo-50"
              textColor="text-blue-800"
            />
            <SummaryCard
              title="Became Senders"
              value={data.viralMetrics.recipientsWhoBecameSenders.toLocaleString()}
              description="Recipients who sent gifts"
              icon="💌"
              bgColor="bg-gradient-to-br from-green-50 to-emerald-50"
              textColor="text-green-800"
            />
            <SummaryCard
              title="Conversion Rate"
              value={`${data.viralMetrics.viralConversionRate.toFixed(1)}%`}
              description="Recipient → Sender"
              icon="📈"
              bgColor="bg-gradient-to-br from-teal-50 to-cyan-50"
              textColor="text-teal-800"
            />
            <SummaryCard
              title="Total Senders"
              value={data.viralMetrics.totalSenders.toLocaleString()}
              description="Unique gift senders"
              icon="👥"
              bgColor="bg-gradient-to-br from-purple-50 to-violet-50"
              textColor="text-purple-800"
            />
            <SummaryCard
              title="Viral Coefficient"
              value={data.viralMetrics.viralCoefficient.toFixed(2)}
              description="Recipients per sender"
              icon="🔄"
              bgColor="bg-gradient-to-br from-yellow-50 to-orange-50"
              textColor="text-yellow-800"
            />
          </div>

          {/* Viral Loop Visualization */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              🔄 Viral Loop Flow
            </h2>
            
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">👤</span>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {data.viralMetrics.totalSenders}
                </div>
                <div className="text-xs text-gray-500">Senders</div>
              </div>
              
              <div className="flex items-center">
                <span className="text-2xl">→</span>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">🎁</span>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {data.viralMetrics.totalRecipients}
                </div>
                <div className="text-xs text-gray-500">Recipients</div>
              </div>
              
              <div className="flex items-center">
                <span className="text-2xl">→</span>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">💌</span>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {data.viralMetrics.recipientsWhoBecameSenders}
                </div>
                <div className="text-xs text-gray-500">New Senders</div>
              </div>
            </div>
            
            <div className="text-center mt-6">
              <div className="inline-flex items-center px-4 py-2 bg-teal-50 rounded-lg">
                <span className="text-teal-800 font-semibold">
                  Viral Coefficient: {data.viralMetrics.viralCoefficient.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Each sender generates {data.viralMetrics.viralCoefficient.toFixed(2)} new recipients on average
              </p>
            </div>
          </div>

          {/* Cohort Analysis */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              📊 Cohort Analysis
            </h2>
            
            {data.cohortAnalysis.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        New Recipients
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Became Senders
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Conversion Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.cohortAnalysis.map((cohort, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {new Date(cohort._id).toLocaleDateString('en-IE', { 
                            year: 'numeric', 
                            month: 'short' 
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cohort.totalRecipients}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cohort.becameSenders}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-teal-600 h-2 rounded-full"
                                style={{ width: `${Math.min(cohort.conversionRate * 100, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-900">
                              {(cohort.conversionRate * 100).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl mb-4 block">🚀</span>
                <p>No viral loop data found for the selected period.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

