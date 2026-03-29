'use client';

import { useState } from 'react';

interface MarkPaidDialogProps {
  merchantId: string;
  merchantName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MarkPaidDialog({
  merchantId,
  merchantName,
  isOpen,
  onClose,
  onSuccess
}: MarkPaidDialogProps) {
  const [paidUpToDate, setPaidUpToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paidUpToDate) {
      setError('Please select a cutoff date');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/payouts/mark-paid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantId,
          paidUpToDate
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(`Successfully marked ${result.markedAsPaid} items as paid up to ${result.cutoffDate}`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setError(result.error || 'Failed to mark items as paid');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Mark as Paid
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-blue-600 text-xl mr-3">🏪</div>
              <div>
                <h3 className="font-medium text-blue-900">Café: {merchantName}</h3>
                <p className="text-blue-700 text-sm">
                  Mark all redemptions as paid up to a specific date
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="paidUpToDate" className="block text-sm font-medium text-gray-700 mb-2">
              Mark as paid up to date
            </label>
            <input
              type="date"
              id="paidUpToDate"
              value={paidUpToDate}
              onChange={(e) => setPaidUpToDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-black transition-colors"
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              All redemptions up to this date will be marked as paid
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-red-600 text-xl mr-3">⚠️</div>
                <div>
                  <h4 className="font-medium text-red-900">Error</h4>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-green-600 text-xl mr-3">✅</div>
                <div>
                  <h4 className="font-medium text-green-900">Success</h4>
                  <p className="text-green-700 text-sm">{success}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-teal-600 text-white px-4 py-3 rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Mark as Paid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
