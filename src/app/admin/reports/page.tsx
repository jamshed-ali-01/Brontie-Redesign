'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Merchant {
  _id: string;
  name: string;
  status: string;
  isActive: boolean;
}

interface Report {
  _id: string;
  invoiceNumber: number;
  merchantId: {
    _id: string;
    name: string;
    contactEmail: string;
  };
  reportPeriod: {
    from: string;
    to: string;
  };
  fileName: string;
  emailSent: boolean;
  recipientEmail?: string;
  sentAt?: string;
  createdAt: string;
}

export default function AdminReportsPage() {
  const [merchantId, setMerchantId] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loadingMerchants, setLoadingMerchants] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [selectedMerchantFilter, setSelectedMerchantFilter] = useState('');
  const [resetMerchantId, setResetMerchantId] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetNotes, setResetNotes] = useState('');
  const [resetHistory, setResetHistory] = useState<any[]>([]);

  // Fetch merchants on component mount
  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const response = await fetch('/api/admin/merchants');
        const data = await response.json();
        
        if (response.ok && data.success) {
          // Filter only approved and active merchants
          const approvedMerchants = data.data.filter((merchant: Merchant) => 
            merchant.status === 'approved' && merchant.isActive
          );
          setMerchants(approvedMerchants);
        } else {
          console.error('Failed to fetch merchants:', data.error);
          toast.error('Failed to load merchants');
        }
      } catch (err) {
        console.error('Error fetching merchants:', err);
        toast.error('Error loading merchants');
      } finally {
        setLoadingMerchants(false);
      }
    };

    fetchMerchants();
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const url = selectedMerchantFilter 
        ? `/api/admin/reports?merchantId=${selectedMerchantFilter}`
        : '/api/admin/reports';
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok && data.success) {
        setReports(data.data);
      } else {
        console.error('Failed to fetch reports:', data.error);
        toast.error('Failed to load reports');
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      toast.error('Error loading reports');
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedMerchantFilter]);

  // Reset history fetch karein
  const fetchResetHistory = async () => {
    if (!resetMerchantId.trim()) return;
    
    try {
      const response = await fetch(`/api/admin/reset-redeemed-period?merchantId=${resetMerchantId}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        setResetHistory(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch reset history:', error);
      toast.error('Failed to load reset history');
    }
  };

  // Jab merchant select ho tab reset history fetch karein
  useEffect(() => {
    if (resetMerchantId.trim()) {
      fetchResetHistory();
    } else {
      setResetHistory([]);
    }
  }, [resetMerchantId]);

  const sendTestReport = async () => {
    if (!merchantId.trim()) {
      toast.error('Please select a merchant');
      return;
    }

    setLoading(true);

    try {
      const loadingToast = toast.loading('Sending test report...');
      
      const response = await fetch('/api/admin/reports/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          merchantId: merchantId.trim(),
          testEmail: testEmail.trim() || undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.dismiss(loadingToast);
        toast.success('Test report sent successfully!');
        // Refresh reports list after sending
        fetchReports();
      } else {
        toast.dismiss(loadingToast);
        toast.error(data.error || 'Failed to send test report');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendAllReports = async () => {
    if (!confirm('Are you sure you want to send reports to ALL active merchants? This should only be done on Wednesdays.')) {
      return;
    }

    setLoading(true);

    try {
      const loadingToast = toast.loading('Sending reports to all merchants...');
      
      const response = await fetch('/api/admin/reports/send-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (response.ok) {
        toast.dismiss(loadingToast);
        toast.success('Reports sent to all merchants successfully!');
        // Refresh reports list after sending
        fetchReports();
      } else {
        toast.dismiss(loadingToast);
        toast.error(data.error || 'Failed to send reports');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetRedeemedPeriod = async () => {
    if (!resetMerchantId.trim()) {
      toast.error('Please select a merchant');
      return;
    }

    if (!confirm('Are you sure you want to reset the redeemed period for this merchant? This will clear the redeemed vouchers count for the current period.')) {
      return;
    }

    setResetting(true);

    try {
      const loadingToast = toast.loading('Resetting redeemed period...');
      
      const response = await fetch('/api/admin/reset-redeemed-period', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          merchantId: resetMerchantId.trim(),
          notes: resetNotes.trim() || 'Manual reset by admin'
        }) 
      });

      const data = await response.json();

      if (response.ok) {
        toast.dismiss(loadingToast);
        const selectedMerchant = merchants.find(m => m._id === resetMerchantId);
        toast.success(`Redeemed period reset successfully for ${selectedMerchant?.name || 'selected merchant'}!`);
        
        // Reset form fields
        setResetNotes('');
        // Refresh reset history
        fetchResetHistory();
      } else {
        toast.dismiss(loadingToast);
        toast.error(data.error || 'Failed to reset redeemed period');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  const downloadReport = (reportId: string, fileName: string) => {
    window.open(`/api/admin/reports/${reportId}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">📊 Café Reports Management</h1>

          <div className="space-y-8">
            {/* Test Single Report */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">🧪 Test Single Report</h2>
              <p className="text-gray-600 mb-4">
                Send a test report to a specific merchant to verify the system is working correctly.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Merchant *
                  </label>
                  <select
                    value={merchantId}
                    onChange={(e) => setMerchantId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    disabled={loadingMerchants}
                  >
                    <option value="">
                      {loadingMerchants ? 'Loading merchants...' : 'Select a merchant'}
                    </option>
                    {merchants.map((merchant) => (
                      <option key={merchant._id} value={merchant._id}>
                        {merchant.name}
                      </option>
                    ))}
                  </select>
                  {loadingMerchants && (
                    <p className="text-xs text-gray-500 mt-1">Loading merchants from database...</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Email (optional)
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Override recipient email for testing"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If empty, will use the merchant&apos;s registered email
                  </p>
                </div>

                <button
                  onClick={sendTestReport}
                  disabled={loading || !merchantId.trim()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Test Report'}
                </button>
              </div>
            </div>

            {/* Reset Redeemed Period */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">🔄 Reset Redeemed Period</h2>
              <p className="text-gray-600 mb-4">
                Reset the redeemed period for a merchant. This will clear the redeemed vouchers count and start counting from zero.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Merchant *
                  </label>
                  <select
                    value={resetMerchantId}
                    onChange={(e) => setResetMerchantId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    disabled={loadingMerchants}
                  >
                    <option value="">Select merchant</option>
                    {merchants.map((merchant) => (
                      <option key={merchant._id} value={merchant._id}>
                        {merchant.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reset Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={resetNotes}
                    onChange={(e) => setResetNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Reason for reset..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Add a note about why you're resetting the redeemed period
                  </p>
                </div> */}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Reset Effect</h4>
                  <ul className="text-yellow-800 text-sm space-y-1">
                    <li>• Redeemed vouchers count will start from zero</li>
                    <li>• Only vouchers redeemed after reset will be counted</li>
                    <li>• Previous redeemed data preserved in database</li>
                    <li>• This action cannot be undone</li>
                  </ul>
                </div>

                <button
                  onClick={resetRedeemedPeriod}
                  disabled={resetting || !resetMerchantId.trim()}
                  className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resetting ? 'Resetting...' : 'Reset Redeemed Period'}
                </button>
              </div>

              {/* Reset History */}
              {resetHistory.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">📋 Reset History</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {resetHistory.map((record) => (
                      <div key={record._id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                        <div>
                          <span className="text-gray-600">
                            {new Date(record.resetAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {record.notes && (
                            <span className="text-gray-500 text-xs ml-2">- {record.notes}</span>
                          )}
                        </div>
                        <span className="text-gray-400 text-xs">{record.resetBy}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Send All Reports */}
            <div className="border border-red-200 rounded-lg p-6 bg-red-50">
              <h2 className="text-xl font-semibold text-red-900 mb-4">⚠️ Send All Reports</h2>
              <p className="text-red-700 mb-4">
                Send weekly reports to ALL active merchants. This should only be done on Wednesdays as part of the automated weekly process.
              </p>
              
              <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-red-900 mb-2">⚠️ Important Notes:</h3>
                <ul className="text-red-800 text-sm space-y-1">
                  <li>• This will send emails to ALL active merchants</li>
                  <li>• Should only be run on Wednesdays (2 days before Friday payouts)</li>
                  <li>• The process may take several minutes depending on the number of merchants</li>
                  <li>• Failed sends will be logged but won&apos;t stop the process</li>
                </ul>
              </div>

              <button
                onClick={sendAllReports}
                disabled={loading}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending to All Merchants...' : 'Send All Reports'}
              </button>
            </div>

            {/* Saved Reports List */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">📋 Saved Reports</h2>
                <div className="flex gap-4 items-center">
                  <select
                    value={selectedMerchantFilter}
                    onChange={(e) => setSelectedMerchantFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">All Merchants</option>
                    {merchants.map((merchant) => (
                      <option key={merchant._id} value={merchant._id}>
                        {merchant.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={fetchReports}
                    disabled={loadingReports}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
                  >
                    {loadingReports ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
              </div>

              {loadingReports ? (
                <p className="text-gray-500">Loading reports...</p>
              ) : reports.length === 0 ? (
                <p className="text-gray-500">No reports found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invoice #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Merchant
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Period
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email Sent
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reports.map((report) => (
                        <tr key={report._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{report.invoiceNumber}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {report.merchantId?.name || 'Unknown'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {new Date(report.reportPeriod.from).toLocaleDateString('en-GB')} - {new Date(report.reportPeriod.to).toLocaleDateString('en-GB')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {report.emailSent ? (
                              <span className="text-green-600">✓ Sent</span>
                            ) : (
                              <span className="text-gray-400">Not sent</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {new Date(report.createdAt).toLocaleDateString('en-GB')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <button
                              onClick={() => downloadReport(report._id, report.fileName)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}