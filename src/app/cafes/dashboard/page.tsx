'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CreditCardIcon,
  GiftIcon,
  CheckCircleIcon,
  CalendarIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

interface VoucherDetail {
  _id: string;
  giftItemName: string;
  giftItemPrice: number;
  giftItemDescription: string;
  giftItemImage: string;
  purchaseDate: string;
  redemptionDate?: string;
  senderName: string;
  recipientName: string;
  recipientEmail: string;
  message: string;
  status: string;
}

interface DashboardData {

  squareCredentials?: {
    isConfigured: boolean;
    accessToken?: string;
    locationId?: string;
    lastSyncAt?: string;
    syncStatus?: 'pending' | 'synced' | 'error';
  };

  merchantId: string;
  activeVouchers: number;
  activeVouchersValue: number;
  redeemedVouchers: number;
  redeemedVouchersValue: number;
  paidOutValue: number;
  totalRevenue: number;
  topSellingItems: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  balance: number;
  nextPayoutDate: string;
  payoutEligible: boolean;
  recentRedemptions: Array<{
    date: string;
    item: string;
    value: number;
  }>;
  recentPurchases: Array<{
    date: string;
    item: string;
    value: number;
    sender: string;
    recipient: string;
  }>;
  dailyActivity: Array<{
    date: string;
    purchased: number;
    redeemed: number;
  }>;
  payoutDetails?: {
    accountHolderName: string;
    iban: string;
    bic: string;
  };
  availableForPayout: number;
  payoutTransactions: Array<{
    itemName: string;
    date: string;
    grossPrice: number;
    stripeFee: number;
    platformFee: number;
    netAfterStripe: number;
  }>;
  payoutSummary: {
    grossTotal: number;
    totalStripeFees: number;
    netAfterStripe: number;
    platformFee: number;
  };
  accountAge: number;
  brontieFee?: {
    isActive: boolean;
    commissionRate: number;
    activatedAt: string | null;
  };
  stripeConnectSettings?: {
    accountId?: string;
    isConnected: boolean;
    onboardingCompleted: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
    payoutSchedule?: {
      interval: string;
      weekly_anchor?: string;
      delay_days: number;
    };
  };
}

export default function CafeDashboardPage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'redeemed' | null>(null);
  const [voucherDetails, setVoucherDetails] = useState<{
    activeVouchers: VoucherDetail[];
    redeemedVouchers: VoucherDetail[];
  } | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherDetail | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [stripeConnectLoading, setStripeConnectLoading] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const response = await fetch('/api/cafes/profile');
        if (response.ok) {
          const data = await response.json();
          const isLegacy = new Date(data.createdAt) < new Date('2026-03-29');

          // Redirect only if signup is incomplete AND not a legacy merchant
          if (data.signupStep < 8 && !isLegacy) {
            router.push('/cafes/onboarding');
            return;
          }
        }
      } catch (err) {
        console.error('Onboarding check failed:', err);
      }
    };
    
    checkOnboarding();
    fetchDashboardData();
    fetchVoucherDetails();
    checkNotificationsVisibility();

    // Check if returning from Stripe onboarding
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('stripe_success') === 'true') {
      // Update Stripe Connect status
      updateStripeConnectStatus();
    }
  }, []);

  const checkNotificationsVisibility = () => {
    const today = new Date().toDateString();
    const lastShownDate = localStorage.getItem('brontie-notifications-last-shown');

    if (lastShownDate !== today) {
      setShowNotifications(true);
    }
  };

  const closeNotifications = () => {
    const today = new Date().toDateString();
    localStorage.setItem('brontie-notifications-last-shown', today);
    setShowNotifications(false);
  };



  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/cafes/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const fetchVoucherDetails = async () => {
    try {
      const response = await fetch('/api/cafes/voucher-details');
      if (response.ok) {
        const data = await response.json();
        setVoucherDetails(data);
      }
    } catch (error) {
      console.error('Failed to fetch voucher details:', error);
    }
  };

  const handleVoucherClick = (voucher: VoucherDetail) => {
    setSelectedVoucher(voucher);
    setShowModal(true);
  };

  const handleStripeConnectSetup = async () => {
    setStripeConnectLoading(true);
    try {
      const response = await fetch('/api/stripe-connect/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ merchantId: dashboardData?.merchantId }),
      });

      const result = await response.json();

      if (result.success && result.url) {
        // Redirect to Stripe onboarding
        window.location.href = result.url;
      } else if (result.alreadyConnected) {
        // Already connected, refresh the page to show updated status
        window.location.reload();
      } else {
        setError(result.error || 'Failed to create Stripe Connect account');
      }
    } catch (error) {
      console.error('Error setting up Stripe Connect:', error);
      setError('Network error. Please try again.');
    } finally {
      setStripeConnectLoading(false);
    }
  };

  const handleStripeConnectDashboard = async () => {
    if (!dashboardData?.stripeConnectSettings?.accountId) return;

    try {
      const response = await fetch(`/api/stripe-connect/account-link?accountId=${dashboardData.stripeConnectSettings.accountId}`);
      const result = await response.json();

      if (result.success && result.url) {
        window.open(result.url, '_blank');
      } else {
        setError(result.error || 'Failed to open Stripe dashboard');
      }
    } catch (error) {
      console.error('Error opening Stripe dashboard:', error);
      setError('Network error. Please try again.');
    }
  };

  const handleConfigurePayoutSchedule = async () => {
    setStripeConnectLoading(true);
    try {
      const response = await fetch('/api/stripe-connect/configure-payout-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        // Refresh dashboard data to show updated schedule
        await fetchDashboardData();
        setError(''); // Clear any previous errors
      } else {
        setError(result.error || 'Failed to configure payout schedule');
      }
    } catch (error) {
      console.error('Error configuring payout schedule:', error);
      setError('Network error. Please try again.');
    } finally {
      setStripeConnectLoading(false);
    }
  };

  const updateStripeConnectStatus = async () => {
    try {
      const response = await fetch('/api/stripe-connect/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        // Refresh dashboard data to show updated status
        await fetchDashboardData();
        setError(''); // Clear any previous errors
      } else {
        console.error('Failed to update Stripe Connect status:', result.error);
      }
    } catch (error) {
      console.error('Error updating Stripe Connect status:', error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedVoucher(null);
  };

  const getNextPayoutDate = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 5 = Friday

    // Find next Friday
    let daysUntilFriday = 5 - currentDay;
    if (daysUntilFriday <= 0) daysUntilFriday += 7;

    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + daysUntilFriday);

    // Check if it's 2nd or 4th Friday of the month
    const weekOfMonth = Math.ceil((nextFriday.getDate() - 1) / 7);

    if (weekOfMonth === 2 || weekOfMonth === 4) {
      return nextFriday.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    }

    // Find the next 2nd or 4th Friday
    let targetWeek = weekOfMonth < 2 ? 2 : 4;
    if (weekOfMonth > 4) {
      targetWeek = 2;
      nextFriday.setMonth(nextFriday.getMonth() + 1);
    }

    const targetDate = new Date(nextFriday);
    targetDate.setDate(1 + (targetWeek - 1) * 7);

    // Adjust to Friday
    const dayOfWeek = targetDate.getDay();
    const daysToAdd = dayOfWeek <= 5 ? 5 - dayOfWeek : 12 - dayOfWeek;
    targetDate.setDate(targetDate.getDate() + daysToAdd);

    return targetDate.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/cafe-logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Redirect to login page
        router.push('/cafes/login');
      } else {
        console.error('Logout failed');
        // Still redirect to login page even if logout API fails
        router.push('/cafes/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect to login page even if logout API fails
      router.push('/cafes/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">☕ Café Dashboard</h1>
              <p className="text-gray-600">Welcome back! Here&apos;s your business overview</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/cafes/profile"
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
              >
                <span className="text-white">Edit Profile</span>
              </Link>
              <Link
                href="/cafes/locations"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span className="text-white">Manage Locations</span>
              </Link>
              <Link
                href="/cafes/items"
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
              >
                <span className="text-white">Manage Items</span>
              </Link>
              <Link
                href="/cafes/store-preview"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <span className="text-white">View Your Store</span>
              </Link>
              <Link
                href="/cafes/analytics/funnel"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <span className="text-white">Analytics</span>
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
        {/* Policy Banner - COMMENTED OUT BY CLIENT REQUEST */}
        {/* {showNotifications && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <div className="text-blue-600 text-xl mr-3">📋</div>
                <div>
                  <h3 className="font-medium text-blue-900 mb-2">Important Brontie Notifications</h3>
                  <p className="text-blue-800 text-sm">
                    <strong>Price Promise:</strong> You must honour the price of any voucher for at least 12 months from purchase 
                    without requesting additional charges at point of sale. After that period, you may charge the difference if 
                    your menu prices have increased.
                  </p>
                </div>
              </div>
              <button
                onClick={closeNotifications}
                className="text-blue-400 hover:text-blue-600 transition-colors ml-4 flex-shrink-0"
                aria-label="Close notifications"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )} */}

        {/* Payment Setup Banner */}
        {(!dashboardData?.stripeConnectSettings?.isConnected && (!dashboardData?.payoutDetails?.accountHolderName || !dashboardData?.payoutDetails?.iban)) && (
          <div className="bg-gradient-to-r from-yellow-50 to-purple-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <div className="text-yellow-600 text-2xl mr-4">💳</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">Complete Your Payment Setup</h3>
                  <p className="text-gray-700 text-sm mb-3">
                    To receive payouts from your gift sales, you can choose between two payment methods:
                  </p>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <span className="text-purple-600">🔗</span>
                      <span><strong>Stripe Connect:</strong> Automated payouts with lower fees</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-yellow-600">🏦</span>
                      <span><strong>Bank Transfer:</strong> Manual transfers on 2nd and 4th Friday</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <button
                  onClick={handleStripeConnectSetup}
                  disabled={stripeConnectLoading}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex-shrink-0 text-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {stripeConnectLoading ? 'Setting up...' : 'Setup Stripe Connect'}
                </button>
                <Link
                  href="/cafes/profile?tab=payout"
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium flex-shrink-0 text-center"
                >
                  <span className="text-white">Add Bank Details</span>
                </Link>
              </div>
            </div>
          </div>
        )}



        {/* Square Setup Banner */}
        {(!dashboardData?.squareCredentials?.isConfigured) && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <div className="text-green-600 text-2xl mr-4">🔄</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">Setup Square Product Sync</h3>
                  <p className="text-gray-700 text-sm mb-3">
                    Sync your Brontie products with Square to keep inventory and prices updated automatically.
                  </p>

                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <Link
                  href="/cafes/sync"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex-shrink-0 text-center"
                >
                  <span className="text-white">Setup Square Sync</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Top Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <GiftIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Vouchers</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {dashboardData?.activeVouchers || 0}
                  </p>
                  <p className="text-lg font-bold text-blue-600">
                    €{(dashboardData?.activeVouchersValue || 0).toFixed(2)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab(activeTab === 'active' ? null : 'active')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
              >
                {activeTab === 'active' ? 'Hide Details' : 'View Details'}
              </button>
            </div>
            {activeTab === 'active' && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Active Voucher Details:</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {voucherDetails?.activeVouchers.length ? (
                    voucherDetails.activeVouchers.map((voucher) => (
                      <div
                        key={voucher._id}
                        onClick={() => handleVoucherClick(voucher)}
                        className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <div className="flex-1">
                          <span className="text-gray-600">{voucher.giftItemName}</span>
                          <div className="text-xs text-gray-400">
                            To: {voucher.recipientName}
                          </div>
                        </div>
                        <span className="font-semibold text-gray-900">€{voucher.giftItemPrice.toFixed(2)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-4">
                      No active vouchers found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Redeemed This Period</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {dashboardData?.redeemedVouchers || 0}
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    €{(dashboardData?.redeemedVouchersValue || 0).toFixed(2)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab(activeTab === 'redeemed' ? null : 'redeemed')}
                className="text-green-600 hover:text-green-800 text-sm font-medium underline"
              >
                {activeTab === 'redeemed' ? 'Hide Details' : 'View Details'}
              </button>
            </div>
            {activeTab === 'redeemed' && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Redemptions:</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {voucherDetails?.redeemedVouchers.length ? (
                    voucherDetails.redeemedVouchers.map((voucher) => (
                      <div
                        key={voucher._id}
                        onClick={() => handleVoucherClick(voucher)}
                        className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-green-50 cursor-pointer transition-colors"
                      >
                        <div className="flex-1">
                          <span className="text-gray-600">{voucher.giftItemName}</span>
                          <div className="text-xs text-gray-400">
                            {voucher.redemptionDate ? new Date(voucher.redemptionDate).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Unknown date'}
                          </div>
                        </div>
                        <span className="font-semibold text-gray-900">€{voucher.giftItemPrice.toFixed(2)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-4">
                      No redeemed vouchers found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-l-yellow-500">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <BanknotesIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Balance</p>
                <p className="text-3xl font-bold text-yellow-600">
                  €{(dashboardData?.availableForPayout || 0).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  Redeemed Net Revenue = Revenue - Fees
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-l-orange-500">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue from Brontie</p>
                <p className="text-3xl font-bold text-orange-600">
                  €{(dashboardData?.totalRevenue || 0).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  All time total from gift sales
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-l-emerald-500">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Paid Out Already</p>
                <p className="text-3xl font-bold text-emerald-600">
                  €{((dashboardData?.paidOutValue || 0)).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  Total amount paid to your account
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-l-purple-500">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Next Payout</p>
                <p className="text-lg font-semibold text-gray-900">
                  {getNextPayoutDate()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-l-indigo-500">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <CreditCardIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Payout Status</p>
                <p className={`text-lg font-semibold ${dashboardData?.payoutEligible ? 'text-green-600' : 'text-gray-600'
                  }`}>
                  {dashboardData?.payoutEligible
                    ? 'Eligible for payout'
                    : 'Payout available from €5 balance'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-l-teal-500">
            <div className="flex items-center">
              <div className="p-2 bg-teal-100 rounded-lg">
                <span className="text-2xl">📈</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Top Seller</p>
                <p className="text-lg font-semibold text-gray-900">
                  {dashboardData?.topSellingItems[0]?.name || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Activity Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">7-Day Activity</h3>
            <div className="h-64 flex items-end justify-between space-x-1 overflow-hidden">
              {dashboardData?.dailyActivity?.map((day, index) => {
                // Calculate max value for scaling - only consider purchased values
                const allDays = dashboardData.dailyActivity || [];
                const maxValue = allDays.length > 0 ? Math.max(...allDays.map(d => d.purchased || 0)) : 1;
                const scaleFactor = maxValue > 0 ? 180 / maxValue : 1; // Scale to max 180px height to prevent overflow

                return (
                  <div key={index} className="flex flex-col items-center space-y-2 flex-1">
                    <div className="flex flex-col space-y-1 items-center">
                      <div
                        className="bg-teal-500 rounded-t cursor-pointer hover:bg-teal-600 transition-colors relative group"
                        style={{
                          height: `${Math.max((day.purchased || 0) * scaleFactor, (day.purchased || 0) > 0 ? 4 : 0)}px`,
                          width: '16px',
                          minHeight: (day.purchased || 0) > 0 ? '4px' : '0px',
                          maxHeight: '180px'
                        }}
                        title={`Purchased: ${day.purchased || 0}`}
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          Purchased: {day.purchased || 0}
                        </div>
                      </div>
                      {/* Only show redeemed bar if there are actual redemptions */}
                      {(day.redeemed || 0) > 0 && (
                        <div
                          className="bg-yellow-500 rounded-t cursor-pointer hover:bg-yellow-600 transition-colors relative group"
                          style={{
                            height: `${Math.max((day.redeemed || 0) * scaleFactor, 4)}px`,
                            width: '16px',
                            minHeight: '4px',
                            maxHeight: '180px'
                          }}
                          title={`Redeemed: ${day.redeemed || 0}`}
                        >
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            Redeemed: {day.redeemed || 0}
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 text-center">
                      {day.date ? new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : `Day ${index + 1}`}
                    </span>
                  </div>
                );
              }) || (
                  // Fallback when no data
                  <div className="flex items-center justify-center w-full h-full text-gray-500">
                    <div className="text-center">
                      <p className="text-sm">No activity data available</p>
                      <p className="text-xs">Check back later for updates</p>
                    </div>
                  </div>
                )}
            </div>
            <div className="flex justify-center space-x-4 mt-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-teal-500 rounded mr-2"></div>
                <span className="text-sm text-gray-600">Purchased</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
                <span className="text-sm text-gray-600">Redeemed</span>
              </div>
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Items (30 days)</h3>
            <div className="space-y-3">
              {dashboardData?.topSellingItems.slice(0, 5).map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 mr-2">
                      #{index + 1}
                    </span>
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{item.sales} sales</p>
                    <p className="text-xs text-gray-500">€{item.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Redemptions */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Redemptions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData?.recentRedemptions.map((redemption, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(redemption.date).toLocaleDateString('en-IE', { timeZone: 'Europe/Dublin' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {redemption.item}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        €{redemption.value.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Purchases */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Purchases</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From/To</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData?.recentPurchases.map((purchase, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(purchase.date).toLocaleDateString('en-IE', { timeZone: 'Europe/Dublin' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {purchase.item}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        €{purchase.value.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div>
                          <p className="text-xs text-gray-500">From: {purchase.sender}</p>
                          <p className="text-xs text-gray-500">To: {purchase.recipient}</p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Available for Payout */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">💰 Available for Payout</h3>
            <div className="text-right">
              <p className="text-3xl font-bold text-green-600">
                €{(dashboardData?.availableForPayout || 0).toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">After fees</p>
            </div>
          </div>

          {/* Payout Details Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction Fee (1.4% + €0.25)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform Fee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData?.payoutTransactions?.map((transaction, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.itemName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(transaction.date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      €{transaction.grossPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      €{transaction.stripeFee.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      €{transaction.platformFee.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      €{transaction.netAfterStripe.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-xl font-bold text-blue-600">
                  €{(dashboardData?.payoutSummary?.grossTotal || 0).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">From {dashboardData?.payoutTransactions?.length || 0} vouchers</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Redeemed Revenue</p>
                <p className="text-xl font-bold text-gray-900">
                  €{(dashboardData?.payoutSummary?.grossTotal || 0).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">From {dashboardData?.payoutTransactions?.length || 0} vouchers</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Stripe Fees</p>
                <p className="text-xl font-bold text-red-600">
                  €{(dashboardData?.payoutSummary?.totalStripeFees || 0).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">{((dashboardData?.payoutSummary?.totalStripeFees || 0) / (dashboardData?.payoutSummary?.grossTotal || 1) * 100).toFixed(1)}% of gross</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Platform Fee</p>
                <p className="text-xl font-bold text-orange-600">
                  €{(dashboardData?.payoutSummary?.platformFee || 0).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">{((dashboardData?.payoutSummary?.platformFee || 0) / (dashboardData?.payoutSummary?.grossTotal || 1) * 100).toFixed(1)}% of gross</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Net to Cafés</p>
                <p className="text-xl font-bold text-green-600">
                  €{(dashboardData?.availableForPayout || 0).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">{((dashboardData?.availableForPayout || 0) / (dashboardData?.payoutSummary?.grossTotal || 1) * 100).toFixed(1)}% of gross</p>
              </div>
            </div>
          </div>

          {/* Platform Fee Section */}
          <div className={`mt-6 border rounded-lg p-4 ${dashboardData?.brontieFee?.isActive
            ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
            : 'bg-gradient-to-r from-blue-50 to-green-50 border-blue-200'
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-blue-900 mb-2">
                  Platform Fee ({Math.round((dashboardData?.brontieFee?.commissionRate || 0) * 100)}%)
                </h4>
                <div className="space-y-1">
                  {!dashboardData?.brontieFee?.isActive ? (
                    <>
                      <p className="text-lg font-bold text-green-600">
                        Current Status: Waived (Inactive)
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-bold text-orange-600">
                        Current Status: €{dashboardData?.payoutSummary?.platformFee.toFixed(2)} ({Math.round((dashboardData?.brontieFee?.commissionRate || 0) * 100)}% Active)
                      </p>
                    </>
                  )}
                  <p className="text-xs text-blue-600">
                    Account age: {dashboardData?.accountAge || '0'} days
                  </p>
                  {dashboardData?.brontieFee?.isActive && dashboardData?.brontieFee?.activatedAt && (
                    <p className="text-xs text-blue-600">
                      Activated: {new Date(dashboardData.brontieFee.activatedAt).toLocaleDateString('en-IE')}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-600">
                  {dashboardData?.brontieFee?.isActive ? 'Currently active' : 'Inactive'}
                </p>
                <a
                  href="mailto:hello@brontie.com?subject=Platform Fee Modification Request"
                  className="text-xs text-blue-600 mt-1 hover:text-blue-800 underline"
                >
                  Contact admin to modify
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600 text-xl mr-3">⚠️</div>
              <div>
                <h4 className="font-medium text-red-900">Error</h4>
                <p className="text-red-700 text-sm">{error}</p>
                <button
                  onClick={() => setError('')}
                  className="text-red-600 text-xs mt-1 hover:text-red-800 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stripe Connect Section */}
        {dashboardData?.stripeConnectSettings && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              🔗 Stripe Connect Status
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Connection Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${dashboardData.stripeConnectSettings.isConnected
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {dashboardData.stripeConnectSettings.isConnected ? 'Connected' : 'Not Connected'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Onboarding</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${dashboardData.stripeConnectSettings.onboardingCompleted
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {dashboardData.stripeConnectSettings.onboardingCompleted ? 'Completed' : 'Pending'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Payments Enabled</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${dashboardData.stripeConnectSettings.chargesEnabled
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {dashboardData.stripeConnectSettings.chargesEnabled ? 'Yes' : 'No'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Payouts Enabled</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${dashboardData.stripeConnectSettings.payoutsEnabled
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {dashboardData.stripeConnectSettings.payoutsEnabled ? 'Yes' : 'No'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Payout Schedule</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${dashboardData.stripeConnectSettings.payoutSchedule
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {dashboardData.stripeConnectSettings.payoutSchedule
                      ? `${dashboardData.stripeConnectSettings.payoutSchedule.interval} (${dashboardData.stripeConnectSettings.payoutSchedule.weekly_anchor})`
                      : 'Not configured'
                    }
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Benefits of Stripe Connect</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Automated payouts every Friday</li>
                    <li>• 7-day delay for Europe compliance</li>
                    <li>• Lower transaction fees</li>
                    <li>• Direct bank account deposits</li>
                    <li>• Real-time payment tracking</li>
                  </ul>
                </div>

                <div className="flex space-x-3">
                  {!dashboardData.stripeConnectSettings.isConnected ? (
                    <button
                      onClick={handleStripeConnectSetup}
                      disabled={stripeConnectLoading}
                      className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {stripeConnectLoading ? 'Setting up...' : 'Connect Stripe Account'}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleStripeConnectDashboard}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        View Dashboard
                      </button>
                      {!dashboardData.stripeConnectSettings.onboardingCompleted && (
                        <button
                          onClick={handleStripeConnectSetup}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          Complete Setup
                        </button>
                      )}
                      {!dashboardData.stripeConnectSettings.payoutSchedule && (
                        <button
                          onClick={handleConfigurePayoutSchedule}
                          disabled={stripeConnectLoading}
                          className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {stripeConnectLoading ? 'Configuring...' : 'Configure Payout Schedule'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payout Information */}
        {/* <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💶 How Payouts Work</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 mb-3">
              {dashboardData?.stripeConnectSettings?.isConnected
                ? 'With Stripe Connect, you receive automated payouts directly to your bank account.'
                : 'When you sell through Brontie, you get paid directly to your account.'
              }
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Payout Schedule</h4>
                <p className="text-sm text-gray-600">
                  {dashboardData?.stripeConnectSettings?.isConnected
                    ? 'Automated payouts every Friday via Stripe Connect (7-day delay for Europe)'
                    : '2× per month: the 2nd & 4th Friday'
                  }
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Example Calculation</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>1. Customer pays: €12</p>
                  <p>2. Stripe fees: ~€0.53</p>
                  <p>3. Platform fee: €1.14 (10% of balance)</p>
                  <p>4. Café Payout: €10.33</p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✅ No setup fees
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✅ No monthly charges
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✅ You only pay when you earn
              </span>
            </div>
          </div>
        </div> */}
      </div>

      {/* Voucher Details Modal */}
      {showModal && selectedVoucher && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  {selectedVoucher.status === 'unredeemed' ? 'Active Voucher Details' : 'Redeemed Voucher Details'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Gift Item Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Gift Item</h4>
                  <div className="flex items-start space-x-4">
                    {selectedVoucher.giftItemImage && (
                      <img
                        src={selectedVoucher.giftItemImage}
                        alt={selectedVoucher.giftItemName}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{selectedVoucher.giftItemName}</h5>
                      <p className="text-sm text-gray-600 mt-1">{selectedVoucher.giftItemDescription}</p>
                      <p className="text-lg font-bold text-teal-600 mt-2">€{selectedVoucher.giftItemPrice.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Purchase Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Purchase Details</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">From:</span>
                        <span className="ml-2 font-medium">{selectedVoucher.senderName}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">To:</span>
                        <span className="ml-2 font-medium">{selectedVoucher.recipientName}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <span className="ml-2 font-medium">{selectedVoucher.recipientEmail}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Date:</span>
                        <span className="ml-2 font-medium">
                          {new Date(selectedVoucher.purchaseDate).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Redemption Details (if redeemed) */}
                  {selectedVoucher.status === 'redeemed' && selectedVoucher.redemptionDate && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Redemption Details</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <span className="ml-2 font-medium text-green-600">Redeemed</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Date:</span>
                          <span className="ml-2 font-medium">
                            {new Date(selectedVoucher.redemptionDate).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Active Status (if unredeemed) */}
                  {selectedVoucher.status === 'unredeemed' && (
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Status</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <span className="ml-2 font-medium text-yellow-600">Active</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Waiting for redemption</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Message */}
                {selectedVoucher.message && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Personal Message</h4>
                    <p className="text-gray-700 italic">&quot;{selectedVoucher.message}&quot;</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeModal}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
