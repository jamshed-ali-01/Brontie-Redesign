
'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface SquareItem {
  name: string;
  price: number;
  square_id?: string;
  square_name?: string;
  square_price?: number;
  has_price_mismatch?: boolean;
  price_difference?: string;
  action_required?: string;
  recommendation?: string;
  brontie_price?: number;
  redemption_price?: number;
  redemption_note?: string;
  status?: string;
  note?: string;
}

interface SyncData {
  summary: {
    total_giftitems: number;
    exact_matches: number;
    not_matched: number;
    price_mismatches: number;
    sync_percentage: number;
  };
  matched: SquareItem[];
  notMatched: SquareItem[];
  actions_required: {
    setup_missing_products: boolean;
    review_price_changes: boolean;
    note?: string;
  };
  next_steps: string[];
}

interface SquareCredentials {
  accessToken: string;
  locationId: string;
  merchantId: string;
  isConfigured: boolean;
  isActive?: boolean;
  lastSyncAt?: Date;
  lastSyncStatus?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SquareWebhookInfo {
  subscriptionId: string;
  webhookUrl: string;
  notificationUrl: string;
  eventTypes: string[];
  status: string;
  createdAt: Date;
  signatureKey?: string;
  liveSquareStatus?: any;
}

function SquareSyncContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [syncData, setSyncData] = useState<SyncData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [squareCredentials, setSquareCredentials] = useState<SquareCredentials | null>(null);
  const [showSetupForm, setShowSetupForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [isSquareActive, setIsSquareActive] = useState(true);
  const [formData, setFormData] = useState({
    accessToken: '',
    locationId: '',
  });
  const [updateFormData, setUpdateFormData] = useState({
    accessToken: '',
    locationId: '',
  });
  const [loadingCredentials, setLoadingCredentials] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'synced' | 'notMatched'>('all');
  const [autoLoadSync, setAutoLoadSync] = useState(true);
  const [webhookInfo, setWebhookInfo] = useState<SquareWebhookInfo | null>(null);
  const [loadingWebhook, setLoadingWebhook] = useState(false);
  const [showDiscountWebhook, setShowDiscountWebhook] = useState(false);

  useEffect(() => {
    fetchSquareCredentials();

    // Check for OAuth callback params
    const status = searchParams.get('status');
    const errorParam = searchParams.get('error');

    if (status === 'connected') {
      setSuccess('Successfully connected to Square!');
      // Clear params to look cleaner
      router.replace('/cafes/sync');
    } else if (errorParam) {
      let errorMsg = 'Failed to connect to Square';
      switch (errorParam) {
        case 'session_expired': errorMsg = 'Session expired, please login again'; break;
        case 'invalid_state': errorMsg = 'Security check failed. Please try again'; break;
        case 'no_active_location': errorMsg = 'No active location found in your Square account'; break;
        default: errorMsg = `Connection failed: ${errorParam}`;
      }
      setError(errorMsg);
      router.replace('/cafes/sync');
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (squareCredentials?.isConfigured && isSquareActive && autoLoadSync && !syncData) {
      handleAutoSync();
    }
  }, [squareCredentials, isSquareActive, autoLoadSync]);

  const fetchSquareCredentials = async () => {
    try {
      setLoadingCredentials(true);
      const response = await fetch('/api/cafes/square-credentials');
      if (response.ok) {
        const data = await response.json();
        setSquareCredentials(data);
        if (data.isActive !== undefined) {
          setIsSquareActive(data.isActive);
        }
        if (!data.isConfigured) {
          setShowSetupForm(true);
        }

        // Webhook status fetch करें
        if (data.isConfigured && data.isActive !== false) {
          fetchWebhookStatus();
        }
      }
    } catch (error) {
      console.error('Failed to fetch Square credentials:', error);
      setError('Failed to load Square credentials');
    } finally {
      setLoadingCredentials(false);
    }
  };

  const fetchWebhookStatus = async () => {
    try {
      setLoadingWebhook(true);
      const response = await fetch('/api/cafes/square-webhook');

      if (response.ok) {
        const result = await response.json();

        if (result.success && result.hasWebhook) {
          setWebhookInfo(result.webhookInfo);
        } else {
          setWebhookInfo(null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch webhook status:', error);
    } finally {
      setLoadingWebhook(false);
    }
  };

  const handleAutoSync = async () => {
    if (!isSquareActive || !squareCredentials?.isConfigured) return;

    try {
      const response = await fetch('/api/cafes/square-sync', {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok) {
        setSyncData(result);
        setAutoLoadSync(false);
      }
    } catch (error) {
      console.error('Auto sync failed:', error);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/cafes/square-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('Square credentials saved successfully!');
        setSquareCredentials({
          ...result,
          merchantId: result.merchantId || '',
          isConfigured: true,
          isActive: true
        });
        setIsSquareActive(true);
        setShowSetupForm(false);

        setTimeout(() => {
          handleSync();
        }, 1500);
      } else {
        setError(result.error || 'Failed to save credentials');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupWebhook = async () => {
    if (!isSquareActive || !squareCredentials) {
      setError('Square sync is not active or credentials not found');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/cafes/square-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(result.message || 'Webhook setup successful!');
        console.log('🔄 Webhook Setup Result:', result);

        setTimeout(() => {
          fetchWebhookStatus();
        }, 1000);
      } else {
        setError(result.error || 'Failed to setup webhook');
      }
    } catch (error) {
      console.error('Webhook setup error:', error);
      setError('Network error during webhook setup');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWebhook = async () => {
    if (!confirm('Are you sure you want to delete this webhook? This will stop all automatic sync.')) {
      return;
    }

    setLoadingWebhook(true);
    try {
      const response = await fetch('/api/cafes/square-webhook', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setWebhookInfo(null);
        setSuccess('Webhook deleted successfully!');
      } else {
        setError(result.error || 'Failed to delete webhook');
      }
    } catch (error) {
      setError('Network error during webhook deletion');
    } finally {
      setLoadingWebhook(false);
    }
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/cafes/square-credentials', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updateFormData,
          isActive: isSquareActive
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('Square credentials updated successfully!');

        setSquareCredentials(prev => {
          if (!prev) return null;
          return {
            ...prev,
            accessToken: updateFormData.accessToken || prev.accessToken,
            locationId: updateFormData.locationId || prev.locationId,
            isActive: isSquareActive,
            updatedAt: new Date(),
          };
        });

        setShowUpdateForm(false);
        setUpdateFormData({ accessToken: '', locationId: '' });
      } else {
        setError(result.error || 'Failed to update credentials');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/cafes/square-credentials', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !isSquareActive,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const newStatus = !isSquareActive;
        setIsSquareActive(newStatus);

        setSquareCredentials(prev => {
          if (!prev) return null;
          return {
            ...prev,
            isActive: newStatus,
            updatedAt: new Date(),
          };
        });

        setSuccess(`Square sync ${newStatus ? 'activated' : 'deactivated'} successfully`);
      } else {
        setError(result.error || 'Failed to change sync status');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!isSquareActive) {
      setError('Square sync is currently inactive. Please activate it first.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setSyncData(null);
    setActiveTab('all');

    try {
      const response = await fetch('/api/cafes/square-sync', {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok) {
        setSyncData(result);

        if (result.summary) {
          setSuccess(
            `✅ Sync completed successfully! ${result.summary.exact_matches} products synced, ${result.summary.not_matched} need attention. ${result.summary.price_mismatches} price mismatches detected.`
          );
        } else {
          setSuccess('Sync completed successfully!');
        }

        fetchSquareCredentials();
      } else {
        if (result.action === 'activate_required') {
          setError('Square sync is inactive. Please activate it first.');
        } else {
          setError(result.error || 'Failed to sync products');
        }
      }
    } catch (error) {
      setError('Network error during sync. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/cafe-logout', { method: 'POST' });
      router.push('/cafes/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/cafes/login');
    }
  };

  const handleDeleteConfiguration = async () => {
    if (!confirm('Are you sure you want to delete your Square configuration? This will remove all connection settings and stop syncing.')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/cafes/square-credentials', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('Square configuration deleted successfully');
        setSquareCredentials(null);
        setIsSquareActive(false);
        setSyncData(null);
        setShowSetupForm(true);
        setWebhookInfo(null);
      } else {
        setError(result.error || 'Failed to delete configuration');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredProducts = () => {
    if (!syncData) return [];

    switch (activeTab) {
      case 'synced':
        return syncData.matched || [];
      case 'notMatched':
        return syncData.notMatched || [];
      default:
        return [
          ...(syncData.matched || []),
          ...(syncData.notMatched || [])
        ];
    }
  };

  const getTabCount = (tab: string) => {
    if (!syncData) return 0;

    switch (tab) {
      case 'synced':
        return syncData.matched?.length || 0;
      case 'notMatched':
        return syncData.notMatched?.length || 0;
      default:
        return (syncData.matched?.length || 0) + (syncData.notMatched?.length || 0);
    }
  };

  if (loadingCredentials) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-teal-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-teal-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-6 text-slate-600 font-medium animate-pulse">Initializing Square Sync...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard-style Header */}
      <div className="bg-white shadow-sm border-b overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🔄 Square Product Sync</h1>
              <p className="text-gray-600">Keep your Brontie inventory and Square catalog in sync</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/cafes/dashboard"
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
              >
                <span className="text-white">← Back to Dashboard</span>
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <span className="text-white">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts Section */}
        <div className="space-y-4 mb-8">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                <span className="mr-2">✅</span>
                <p>{success}</p>
              </div>
              <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">✕</button>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-4 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <span className="mr-3 text-xl">⚠️</span>
                  <div>
                    <p className="font-bold mb-1">Action Required</p>
                    <p className="text-sm leading-relaxed">
                      {error.includes('Login with Square') ? (
                        <>
                          {error.split("Please click 'Login with Square' again")[0]}
                          <span className="block mt-2 font-bold bg-white px-3 py-2 rounded border border-red-100 shadow-sm">
                            👉 Please click <span className="text-teal-600">"Login with Square"</span> again in the setup section below to update your permissions.
                          </span>
                        </>
                      ) : error}
                    </p>
                  </div>
                </div>
                <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-4">✕</button>
              </div>
            </div>
          )}
        </div>

        {showSetupForm && (
          <div className="bg-white rounded-lg shadow p-8 max-w-2xl mx-auto border border-gray-100">
            <div className="text-center mb-8">
              <div className="text-4xl mb-4">🔌</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Square Account</h2>
              <p className="text-gray-600">Choose a method to link your Square catalog with Brontie.</p>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-teal-50 border border-teal-100 rounded-xl text-center">
                <h3 className="text-lg font-semibold text-teal-900 mb-2">Automated Setup</h3>
                <p className="text-teal-700 text-sm mb-6">The fastest way to connect. We'll automatically fetch your locations and handle security.</p>
                <a
                  href="/api/cafes/square-auth/authorize"
                  className="inline-block bg-teal-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors shadow-sm"
                >
                  Login with Square
                </a>
              </div>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-400 uppercase tracking-widest font-medium">Or Manual</span></div>
              </div>

              <details className="group">
                <summary className="cursor-pointer text-center text-gray-500 font-medium hover:text-teal-600 transition-colors list-none">
                  Manual Configuration Details ▼
                </summary>
                <form onSubmit={handleFormSubmit} className="mt-6 space-y-4 pt-4 border-t border-gray-50">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Square Access Token</label>
                    <input
                      type="password"
                      value={formData.accessToken}
                      onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 outline-none"
                      placeholder="sq0atp-..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Square Location ID</label>
                    <input
                      type="text"
                      value={formData.locationId}
                      onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 outline-none"
                      placeholder="L..."
                      required
                    />
                  </div>
                  <div className="flex space-x-3 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Processing...' : 'Save Credentials'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSetupForm(false)}
                      className="px-6 py-3 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </details>
            </div>
          </div>
        )}

        {!showSetupForm && squareCredentials?.isConfigured && (
          <div className="space-y-8">
            {/* Connection Status Card - Dashboard Metric Style */}
            <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${isSquareActive ? 'border-l-green-500' : 'border-l-yellow-500'}`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${isSquareActive ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                    <span className="text-2xl">{isSquareActive ? '⚡' : '💤'}</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-bold text-gray-900">Square Connection: {isSquareActive ? 'Active' : 'Paused'}</h3>
                    <p className="text-sm text-gray-500 font-medium">Location ID: <code className="bg-gray-100 px-1 rounded">{squareCredentials.locationId}</code></p>
                    {squareCredentials.lastSyncAt && (
                      <p className="text-xs text-gray-400 mt-1">Last synced: {new Date(squareCredentials.lastSyncAt).toLocaleString()}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <button
                    onClick={handleSync}
                    disabled={loading || !isSquareActive}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Syncing...' : '🔄 Sync Now'}
                  </button>
                  <button
                    onClick={handleToggleActive}
                    className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-semibold transition-colors ${isSquareActive
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                      : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                  >
                    {isSquareActive ? '⏸ Pause Sync' : '▶ Resume Sync'}
                  </button>
                  <button
                    onClick={() => setShowUpdateForm(!showUpdateForm)}
                    className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {showUpdateForm ? '✕ Close' : '🔧 Update'}
                  </button>
                  <button
                    onClick={handleDeleteConfiguration}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex-1 md:flex-none"
                  >
                    🗑️ Delete Link
                  </button>
                </div>
              </div>

              {showUpdateForm && (
                <div className="mt-8 pt-6 border-t border-gray-100 animate-in fade-in duration-300">
                  <h4 className="font-bold text-gray-900 mb-4">Update Direct Credentials</h4>
                  <form onSubmit={handleUpdateCredentials} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <input
                        type="password"
                        value={updateFormData.accessToken}
                        onChange={(e) => setUpdateFormData({ ...updateFormData, accessToken: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                        placeholder="New Access Token (empty to keep)"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={updateFormData.locationId}
                        onChange={(e) => setUpdateFormData({ ...updateFormData, locationId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                        placeholder="New Location ID (empty to keep)"
                      />
                    </div>
                    <div className="md:col-span-2 text-right">
                      <button type="submit" className="bg-gray-900 text-white px-8 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors">
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Sync Intelligence - Metric Style */}
            {syncData && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                    <p className="text-sm font-semibold text-gray-500 mb-1">Products added in Brontie</p>
                    <p className="text-3xl font-bold text-teal-600">{syncData.summary.total_giftitems}</p>
                    <p className="text-xs text-gray-400 mt-1">Total items in your Brontie catalog</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                    <p className="text-sm font-semibold text-gray-500 mb-1">Square Synced</p>
                    <p className="text-3xl font-bold text-green-600">{syncData.summary.exact_matches}</p>
                    <p className="text-xs text-gray-400 mt-1">Items linked with Square (Verified)</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                    <p className="text-sm font-semibold text-gray-500 mb-1">Missing from Square</p>
                    <p className="text-3xl font-bold text-orange-500">
                      {syncData.summary.not_matched}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Products needing setup</p>
                  </div>
                </div>

                {/* Important Logic Note */}
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="text-blue-400 text-xl">ℹ️</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700 font-medium">
                        Important: If webhooks are disabled, prices will not auto-update. In case of a price mismatch, the redemption price will be the one defined in Brontie.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-8 border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-bold text-gray-900">Synchronization Health</h4>
                    <span className="text-2xl font-black text-teal-600">{syncData.summary.sync_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-600 h-full transition-all duration-1000"
                      style={{ width: `${syncData.summary.sync_percentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Tabbed Product Table */}
                <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Brontie Price</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Square Price</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Variance</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {getFilteredProducts().length > 0 ? (
                        getFilteredProducts().map((product, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-bold text-gray-900 block">{product.name}</span>
                              {product.square_id && <span className="text-[10px] font-mono text-gray-400">ID: {product.square_id.substring(0, 15)}...</span>}
                            </td>
                            <td className="px-6 py-4 font-semibold text-gray-700">€{(product.brontie_price || product.price || 0).toFixed(2)}</td>
                            <td className="px-6 py-4 font-semibold text-gray-700">
                              {product.square_price ? `€${product.square_price.toFixed(2)}` : 'N/A'}
                            </td>
                            <td className="px-6 py-4">
                              {product.has_price_mismatch ? (
                                <span className={`font-bold ${parseFloat(product.price_difference || '0') > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {parseFloat(product.price_difference || '0') > 0 ? '▲' : '▼'} €{Math.abs(parseFloat(product.price_difference || '0')).toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-gray-300">──</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {product.has_price_mismatch ? (
                                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Mismatch</span>
                              ) : product.square_id ? (
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Synced</span>
                              ) : (
                                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Missing</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium italic">No products found for this filter.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* Automation Card - Refined Light Teal Style */}
            <div className="bg-teal-50 rounded-xl p-8 md:p-10 border border-teal-100 relative overflow-hidden group mb-8">
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center text-2xl">⚡</div>
                    <h3 className="text-2xl font-bold text-teal-900">Automated Price Sync</h3>
                  </div>
                  <p className="text-teal-800/80 mb-8 max-w-lg">
                    Connect your Square catalog to automatically synchronize product prices. Your Brontie prices will update instantly whenever you make a change in Square.
                  </p>
                  {webhookInfo ? (
                    <div className="flex flex-wrap gap-4">
                      <div className="px-6 py-4 bg-white rounded-xl border border-teal-200 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-teal-500 mb-1">Status</p>
                        <p className="font-bold text-green-600 uppercase tracking-widest">{webhookInfo.status}</p>
                      </div>
                      {/* <button
                        onClick={handleDeleteWebhook}
                        className="px-8 py-4 bg-red-50 text-red-600 rounded-xl font-bold transition-all border border-red-100 hover:bg-red-100"
                      >
                        Disconnect Automation
                      </button> */}
                    </div>
                  ) : (
                    <button
                      onClick={handleSetupWebhook}
                      disabled={loading || !isSquareActive}
                      className="bg-teal-600 text-white px-10 py-4 rounded-xl font-black text-lg hover:bg-teal-700 transition-all active:scale-95 shadow-lg shadow-teal-500/10"
                    >
                      Enable Live Automation
                    </button>
                  )}
                </div>
                <div className="flex justify-center lg:justify-end">
                  <div className="p-6 bg-white rounded-xl border border-teal-100 shadow-sm text-center w-full max-w-[240px]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-teal-500 mb-1">Feature</p>
                    <p className="font-bold text-teal-900">Auto Price Updates</p>
                    <div className="mt-2 text-xs text-teal-600 font-medium">Synced instantly from Square</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!syncData && !success && !error && (
          <div className="mt-8 bg-white border border-gray-100 shadow rounded-lg p-12 text-center">
            <div className="text-4xl mb-4 animate-spin inline-block">🔄</div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Syncing Catalog...</h4>
            <p className="text-gray-600 font-medium">Please wait while we establish a fresh connection with Square.</p>
            {!isSquareActive && (
              <p className="mt-4 text-yellow-600 font-bold bg-yellow-50 py-2 px-4 rounded-lg inline-block">
                ⚠️ Connection is currently paused
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SquareSyncPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SquareSyncContent />
    </Suspense>
  );
}
