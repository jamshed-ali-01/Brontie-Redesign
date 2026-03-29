'use client';

import { useState, useEffect, useCallback } from 'react';
import { Merchant } from '@/types/merchant';

interface GiftItem {
  _id: string;
  name: string;
}

interface Transaction {
  _id: string;
  giftItemName: string;
  giftItemId: string;
  merchantName: string;
  merchantId: string;
  locationName: string;
  locationId: string;
  amount: number;
  status: 'unredeemed' | 'redeemed' | 'issued';
  senderName?: string;
  recipientName?: string;
  createdAt: string;
  redeemedAt?: string;
  paymentIntentId?: string;
  sessionId?: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [giftItems, setGiftItems] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMerchant, setFilterMerchant] = useState('');
  const [filterGiftItem, setFilterGiftItem] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterRedeemedDateFrom, setFilterRedeemedDateFrom] = useState('');
  const [filterRedeemedDateTo, setFilterRedeemedDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  // Fetch merchants and gift items on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [merchantsRes, giftItemsRes] = await Promise.all([
          fetch('/api/admin/merchants'),
          fetch('/api/admin/gift-items')
        ]);

        if (merchantsRes.ok) {
          const merchantsData = await merchantsRes.json();
          setMerchants(merchantsData.data || merchantsData.merchants || []);
        }

        if (giftItemsRes.ok) {
          const giftItemsData = await giftItemsRes.json();
          setGiftItems(giftItemsData.giftItems || giftItemsData.data || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });

      if (filterMerchant) params.append('merchantId', filterMerchant);
      if (filterGiftItem) params.append('giftItemId', filterGiftItem);
      if (filterStatus) params.append('status', filterStatus);
      if (filterDateFrom) params.append('dateFrom', filterDateFrom);
      if (filterDateTo) params.append('dateTo', filterDateTo);
      if (filterRedeemedDateFrom) params.append('redeemedDateFrom', filterRedeemedDateFrom);
      if (filterRedeemedDateTo) params.append('redeemedDateTo', filterRedeemedDateTo);

      const response = await fetch(`/api/admin/transactions?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
      } else {
        console.error('Error fetching transactions:', response.status);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Network error:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterMerchant, filterGiftItem, filterStatus, filterDateFrom, filterDateTo, filterRedeemedDateFrom, filterRedeemedDateTo]);

  // Fetch transactions when filters change
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleClearFilters = () => {
    setFilterMerchant('');
    setFilterGiftItem('');
    setFilterStatus('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterRedeemedDateFrom('');
    setFilterRedeemedDateTo('');
    setCurrentPage(1);
  };

  const formatCurrency = (amount: number) => {
    const validAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'EUR',
    }).format(validAmount);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const exportTransactions = async () => {
    try {
      const params = new URLSearchParams();
      if (filterMerchant) params.append('merchantId', filterMerchant);
      if (filterGiftItem) params.append('giftItemId', filterGiftItem);
      if (filterStatus) params.append('status', filterStatus);
      if (filterDateFrom) params.append('dateFrom', filterDateFrom);
      if (filterDateTo) params.append('dateTo', filterDateTo);
      if (filterRedeemedDateFrom) params.append('redeemedDateFrom', filterRedeemedDateFrom);
      if (filterRedeemedDateTo) params.append('redeemedDateTo', filterRedeemedDateTo);
      params.append('export', 'true');

      const response = await fetch(`/api/admin/transactions?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to export transactions');
      }
    } catch (error) {
      console.error('Error exporting transactions:', error);
      alert('Failed to export transactions');
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <button
          onClick={exportTransactions}
          className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-amber-100 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Merchant</label>
            <select
              value={filterMerchant}
              onChange={(e) => {
                setFilterMerchant(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-black"
            >
              <option value="">All Merchants</option>
              {merchants.map(merchant => (
                <option key={merchant._id} value={merchant._id}>{merchant.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gift Item</label>
            <select
              value={filterGiftItem}
              onChange={(e) => {
                setFilterGiftItem(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-black"
            >
              <option value="">All Gift Items</option>
              {giftItems.map(item => (
                <option key={item._id} value={item._id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-black"
            >
              <option value="">All Statuses</option>
              <option value="issued">Unredeemed</option>
              <option value="redeemed">Redeemed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Created Date From</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => {
                setFilterDateFrom(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Created Date To</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => {
                setFilterDateTo(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Redeemed Date From</label>
            <input
              type="date"
              value={filterRedeemedDateFrom}
              onChange={(e) => {
                setFilterRedeemedDateFrom(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Redeemed Date To</label>
            <input
              type="date"
              value={filterRedeemedDateTo}
              onChange={(e) => {
                setFilterRedeemedDateTo(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-black"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear All Filters
          </button>
          <button
            onClick={() => fetchTransactions()}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-amber-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-amber-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gift Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Merchant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sender/Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Redeemed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment ID
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-600"></div>
                      <span className="ml-3 text-gray-600">Loading transactions...</span>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="text-4xl mb-2">📭</div>
                      <p className="text-lg font-medium">No transactions found</p>
                      <p className="text-sm">Try adjusting your filters or check if there are any transactions in the system.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{transaction.giftItemName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{transaction.merchantName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">From: {transaction.senderName || 'N/A'}</div>
                        <div className="text-xs text-gray-500">To: {transaction.recipientName || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{transaction.locationName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(transaction.amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.status === 'redeemed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transaction.status === 'redeemed' ? 'Redeemed' : 'Unredeemed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.redeemedAt ? formatDate(transaction.redeemedAt) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="max-w-32 truncate font-mono text-xs">
                        {transaction.paymentIntentId || transaction.sessionId || '-'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                            ? 'z-10 bg-amber-50 border-amber-500 text-amber-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}