'use client';

import { useState, useEffect } from 'react';
import AnalyticsFilters from '@/components/admin/AnalyticsFilters';
import SummaryCard from '@/components/admin/SummaryCard';

interface ProductMixData {
  productMix: Array<{
    productSku: string;
    productName: string;
    price: number;
    count: number;
    totalRevenue: number;
    avgOrderValue: number;
    marketShare: number;
    revenueShare: number;
  }>;
  totals: {
    totalCount: number;
    totalRevenue: number;
    overallAOV: number;
  };
  timeSeries: Array<{
    _id: {
      year: number;
      month: number;
      day: number;
    };
    count: number;
    totalRevenue: number;
    avgOrderValue: number;
    date: string;
  }>;
}

export default function ProductMixPage() {
  const [selectedMerchantId, setSelectedMerchantId] = useState('');
  const [dateFrom, setDateFrom] = useState('2025-09-26');
  const [dateTo, setDateTo] = useState('');
  const [data, setData] = useState<ProductMixData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedMerchantId) params.append('merchantId', selectedMerchantId);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await fetch(`/api/cafes/analytics/product-mix?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching product mix data:', error);
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
            📦 Product Mix & AOV
          </h1>
          <p className="text-gray-600">
            Product share and Average Order Value.
          </p>
        </div>

        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
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
          📦 Product Mix & AOV
        </h1>
        <p className="text-gray-600">
          Product share and Average Order Value.
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
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SummaryCard
              title="Total Vouchers"
              value={data.totals.totalCount.toLocaleString()}
              description="Redeemed vouchers"
              icon="🎫"
              bgColor="bg-gradient-to-br from-blue-50 to-indigo-50"
              textColor="text-blue-800"
            />
            <SummaryCard
              title="Total Revenue"
              value={formatCurrency(data.totals.totalRevenue)}
              description="From all products"
              icon="💰"
              bgColor="bg-gradient-to-br from-green-50 to-emerald-50"
              textColor="text-green-800"
            />
            <SummaryCard
              title="Overall AOV"
              value={formatCurrency(data.totals.overallAOV)}
              description="Average Order Value"
              icon="📊"
              bgColor="bg-gradient-to-br from-teal-50 to-cyan-50"
              textColor="text-teal-800"
            />
          </div>

          {/* Product Mix */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              📊 Product Mix Analysis
            </h2>
            
            {data.productMix.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Market Share
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        AOV
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.productMix.map((product, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {product.productName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.productSku}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(product.totalRevenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-teal-600 h-2 rounded-full"
                                style={{ width: `${product.marketShare}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-900">
                              {product.marketShare.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(product.avgOrderValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl mb-4 block">📦</span>
                <p>No product mix data found for the selected period.</p>
              </div>
            )}
          </div>

          {/* Revenue Share Visualization */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              🥧 Revenue Share by Product
            </h2>
            
            <div className="space-y-4">
              {data.productMix.slice(0, 5).map((product, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-48 text-sm font-medium text-gray-700 truncate">
                    {product.productName}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                    <div
                      className="bg-teal-600 h-4 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${product.revenueShare}%` }}
                    >
                      {product.revenueShare > 10 && (
                        <span className="text-white text-xs font-medium">
                          {product.revenueShare.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-24 text-sm text-gray-900 text-right">
                    {formatCurrency(product.totalRevenue)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
