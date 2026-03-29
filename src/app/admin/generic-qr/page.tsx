'use client';

import { useEffect, useState } from 'react';

interface GenericQR {
  _id: string;
  shortId: string;
  type: 'homepage' | 'products' | 'custom';
  targetUrl: string;
  description?: string;
  scanCount?: number;
  createdAt?: string;
}

export default function AdminGenericQRListPage() {
  const [items, setItems] = useState<GenericQR[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/generic-qr/list');
      if (!res.ok) throw new Error('Failed to fetch generic QRs');
      const json = await res.json();
      setItems(json.qrCodes || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this QR code?')) return;
    try {
      const res = await fetch(`/api/admin/generic-qr/delete?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete QR');
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Generic QR Codes</h1>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-amber-100">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-amber-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Created</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Short ID</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Description</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Type</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Target URL</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {items.length === 0 ? (
              <tr><td className="px-4 py-3 text-gray-500" colSpan={6}>No generic QR codes</td></tr>
            ) : (
              items.map((qr) => (
                <tr key={qr._id}>
                  <td className="px-4 py-2 text-gray-600">{qr.createdAt ? new Date(qr.createdAt).toLocaleString() : '—'}</td>
                  <td className="px-4 py-2 font-mono">{qr.shortId}</td>
                  <td className="px-4 py-2">{qr.description || '—'}</td>
                  <td className="px-4 py-2 capitalize">{qr.type}</td>
                  <td className="px-4 py-2">
                    <a href={qr.targetUrl} target="_blank" className="text-amber-700 underline break-all" rel="noreferrer">
                      {qr.targetUrl}
                    </a>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <a
                        className="px-2 py-1 text-xs bg-gray-100 rounded border"
                        href={`https://www.brontie.ie/qr/${qr.shortId}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open
                      </a>
                      <button
                        onClick={() => handleDelete(qr._id)}
                        className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded border border-red-200 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


