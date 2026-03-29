'use client';

import { useEffect, useState } from 'react';

interface QRAnalytics {
  totalScans: number;
  uniqueUsers: number;
  scansByMerchant: Record<string, number>;
  scansByType: Record<string, number>;
}

interface FunnelAnalytics {
  qrScans: number;
  productViews: number;
  addToCart: number;
  checkout: number;
  purchases: number;
}

export default function PosthogDataPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [merchant, setMerchant] = useState<string>('all');
  const [qr, setQr] = useState<QRAnalytics | null>(null); // derived client-side
  const [funnel, setFunnel] = useState<FunnelAnalytics | null>(null); // derived client-side
  const [recent, setRecent] = useState<any[]>([]); // derived client-side (filtered)
  const [recentAll, setRecentAll] = useState<any[]>([]); // raw, unfiltered
  const [genericCounts, setGenericCounts] = useState<Record<string, number>>({});
  const [merchants, setMerchants] = useState<{ _id: string; name: string }[]>([]);

  useEffect(() => {
    // Load merchants for selector
    const loadMerchants = async () => {
      try {
        const res = await fetch('/api/admin/merchants');
        if (res.ok) {
          const json = await res.json();
          const list = (json.data || []).map((m: any) => ({ _id: m._id, name: m.name }));
          setMerchants(list);
        }
      } catch {}
    };
    loadMerchants();
  }, []);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      // Always fetch unfiltered; filtering is client-side
      const res = await fetch(`/api/admin/posthog`);
      if (!res.ok) throw new Error('Failed to fetch Posthog data');
      const json = await res.json();
      const all = json.data.recentScans || [];
      setRecentAll(all);
      // Derive initial (all)
      deriveClientMetrics('all', all);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const safeProps = (evt: any): Record<string, unknown> => {
    const p = evt?.properties;
    if (!p) return {};
    if (typeof p === 'string') {
      try { return JSON.parse(p); } catch { return {}; }
    }
    return p as Record<string, unknown>;
  };

  const deriveClientMetrics = (selected: string, all: any[]) => {
    // Filter by merchant on the client
    const filtered = all.filter((evt) => {
      if (!evt) return false;
      if (selected === 'all') return true;
      const p = safeProps(evt) as any;
      if (selected === 'generic') {
        return p.merchant_id === 'generic' || p.qr_type === 'generic';
      }
      return p.merchant_id === selected || p.merchant_name === merchants.find(m => m._id === selected)?.name;
    });

    // Recent table uses filtered
    setRecent(filtered.slice(0, 25));

    // Build QR analytics
    const scansByMerchant: Record<string, number> = {};
    const scansByType: Record<string, number> = {};
    const genericBreakdown: Record<string, number> = {};
    const distinct = new Set<string>();
    for (const evt of filtered) {
      const p = safeProps(evt) as any;
      const mName = p.merchant_name || 'Unknown';
      const t = p.qr_type || 'merchant';
      scansByMerchant[mName] = (scansByMerchant[mName] || 0) + 1;
      scansByType[t] = (scansByType[t] || 0) + 1;
      // Generic flyers breakdown by label when target_url includes how-it-works
      const isGeneric = p.merchant_id === 'generic' || t === 'generic';
      const isHowItWorks = typeof p.target_url === 'string' && p.target_url.includes('/how-it-works');
      if (isGeneric && isHowItWorks) {
        const label = (p.location_name as string) || (p.short_id as string) || 'Generic';
        genericBreakdown[label] = (genericBreakdown[label] || 0) + 1;
      }
      if (evt.distinct_id) distinct.add(String(evt.distinct_id));
    }

    setQr({
      totalScans: filtered.length,
      uniqueUsers: distinct.size,
      scansByMerchant,
      scansByType,
    });
    // Compute generic QR breakdown from ALL events (independent of current filter)
    const generics: Record<string, number> = {};
    for (const evt of all) {
      const p = safeProps(evt) as any;
      const isGeneric = p?.merchant_id === 'generic' || p?.qr_type === 'generic';
      if (!isGeneric) continue;
      const label = (p.location_name as string) || (p.short_id as string) || 'Generic';
      generics[label] = (generics[label] || 0) + 1;
    }
    setGenericCounts(generics);

    // Derive funnel: only qrScans available client-side; others 0
    setFunnel({
      qrScans: filtered.length,
      productViews: 0,
      addToCart: 0,
      checkout: 0,
      purchases: 0,
    });
  };

  useEffect(() => {
    deriveClientMetrics(merchant, recentAll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchant, recentAll]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading Posthog data...</p>
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
          <h1 className="text-2xl font-bold text-gray-700 mb-4">Error Loading Posthog Data</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={load}
            className="bg-blue-600 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-700 transition-all duration-300"
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Posthog Data</h1>
          <p className="text-gray-600">Events and funnels sourced from Posthog (qr_code_scanned, navigation, purchase intent).</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Merchant</label>
          <div className="flex gap-2">
            <select
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Merchants</option>
              <option value="generic">Generic QR Codes</option>
              {merchants.map(m => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {qr && (
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 mb-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
              <span className="mr-2">📈</span>
              QR Scan Analytics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <h3 className="text-sm font-medium text-blue-600 mb-2">Total Scans</h3>
                <p className="text-2xl font-bold text-blue-800">{qr.totalScans}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <h3 className="text-sm font-medium text-blue-600 mb-2">Unique Users</h3>
                <p className="text-2xl font-bold text-blue-800">{qr.uniqueUsers}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <h3 className="text-sm font-medium text-blue-600 mb-2">Merchant Types</h3>
                <p className="text-2xl font-bold text-blue-800">{Object.keys(qr.scansByMerchant).length}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <h3 className="text-sm font-medium text-blue-600 mb-2">QR Types</h3>
                <p className="text-2xl font-bold text-blue-800">{Object.keys(qr.scansByType).length}</p>
              </div>
            </div>

            {Object.keys(qr.scansByMerchant).length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">Scans by Merchant</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(qr.scansByMerchant).map(([merchantName, count]) => (
                    <div key={merchantName} className="bg-white rounded-lg p-4 border border-blue-100">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-blue-700">{merchantName}</span>
                        <span className="text-lg font-bold text-blue-800">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Generic QR Codes breakdown */}
        {Object.keys(genericCounts).length > 0 && (
          <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Generic QR Codes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(genericCounts).map(([label, count]) => (
                <div key={label} className="bg-amber-50 rounded-lg p-4 border border-amber-100 flex items-center justify-between">
                  <span className="font-medium text-amber-800">{label}</span>
                  <span className="text-lg font-bold text-amber-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {funnel && (
          <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Funnel (Posthog)</h2>
            <div className="space-y-4">
              {[{ label: 'QR Scans', value: funnel.qrScans }, { label: 'Product Views', value: funnel.productViews }, { label: 'Add to Cart', value: funnel.addToCart }, { label: 'Checkout', value: funnel.checkout }, { label: 'Purchases', value: funnel.purchases }].map((step) => (
                <div key={step.label} className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">{step.label}</span>
                  <span className="text-gray-900 font-semibold">{step.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent qr_code_scanned Events</h2>
          {recent.length === 0 ? (
            <p className="text-gray-600">No recent events.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Time</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Merchant</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Location</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Short ID</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Distinct ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {recent.map((evt, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 text-gray-600">{evt.timestamp}</td>
                      <td className="px-4 py-2">{evt.properties?.merchant_name || '-'}</td>
                      <td className="px-4 py-2">{evt.properties?.location_name || '-'}</td>
                      <td className="px-4 py-2">{evt.properties?.short_id || '-'}</td>
                      <td className="px-4 py-2 text-gray-600">{evt.distinct_id || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


