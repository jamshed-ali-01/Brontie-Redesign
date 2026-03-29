"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Copy, ExternalLink, Calendar, Mail } from "lucide-react";

interface DashboardRecord {
  _id: string;
  ownerEmail: string;
  magicLinkToken: string;
  createdAt: string;
  stats: {
    totalAmount: number;
    totalVouchers: number;
    sentVouchers: number;
  }
}

export default function AdminBulkBuys() {
  const [dashboards, setDashboards] = useState<DashboardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboards();
  }, []);

  const fetchDashboards = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/bulk-buys");
      const data = await res.json();
      
      if (data.success) {
        setDashboards(data.dashboards);
      } else {
        setError(data.error || "Failed to load data");
      }
    } catch(err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (token: string) => {
     navigator.clipboard.writeText(`${window.location.origin}/dashboard/${token}`);
     alert("Dashboard link copied to clipboard!");
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (error) {
     return <div className="text-red-500 font-bold p-4 bg-white rounded-lg shadow-sm border border-red-100">{error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200 bg-white shadow-sm rounded-lg mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bulk Buys (Team/Event)</h1>
          <p className="text-sm text-gray-500">Manage user magic link dashboards</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboards.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                    No bulk purchases found
                  </td>
                </tr>
              ) : (
                dashboards.map((board) => (
                  <tr key={board._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center">
                          <Mail className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            {board.ownerEmail}
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {board.stats.totalVouchers} Gifts
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">ID: {board._id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        {new Date(board.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                         €{board.stats.totalAmount.toFixed(2)}
                       </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 w-full max-w-[150px]">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-amber-500" 
                             style={{ width: `${(board.stats.sentVouchers / board.stats.totalVouchers) * 100}%` }}
                           ></div>
                        </div>
                        <span className="text-xs text-gray-500">{board.stats.sentVouchers}/{board.stats.totalVouchers} sent</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          onClick={() => copyLink(board.magicLinkToken)}
                          className="text-gray-400 hover:text-amber-600 focus:outline-none transition-colors group"
                          title="Copy User Dashboard Link"
                        >
                          <Copy className="h-5 w-5" />
                        </button>
                        <Link 
                           href={`/dashboard/${board.magicLinkToken}`}
                           target="_blank"
                           onClick={(e) => {
                             if (!confirm('You are opening the user dashboard. Modifications here will affect their account. Proceed?')) {
                               e.preventDefault();
                             }
                           }}
                           className="text-gray-400 hover:text-blue-600 focus:outline-none transition-colors"
                           title="Spy Dashboard"
                        >
                           <ExternalLink className="h-5 w-5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
