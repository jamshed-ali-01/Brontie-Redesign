'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import CafeDashboardLayout from '@/components/cafes/layout/CafeDashboardLayout';
import DashboardMetrics from '@/components/cafes/dashboard/DashboardMetrics';
import RecentRedemptionsTable from '@/components/cafes/dashboard/RecentRedemptionsTable';
import RecentPurchasesList from '@/components/cafes/dashboard/RecentPurchasesList';
import { ValidateVoucherBlock, FeedbackBlock } from '@/components/cafes/dashboard/StaticForms';
import DashboardCharts from '@/components/cafes/dashboard/DashboardCharts';
import { Lobster } from 'next/font/google';

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

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
  merchantName?: string;
  merchantLogo?: string;
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
      <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#6ca3a4] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium tracking-wide">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-[#6ca3a4] text-white font-bold px-4 py-2 rounded-xl hover:bg-[#568586] transition-colors"
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
    <CafeDashboardLayout 
      cafeName={dashboardData?.merchantName || 'Cafe Name'} 
      ownerName={dashboardData?.payoutDetails?.accountHolderName || 'User'}
      cafeLogo={dashboardData?.merchantLogo}
    >
      <div className="mb-8">
        <h1 className={`text-4xl text-[#6ca3a4] mb-2 ${lobster.className}`}>Café Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of your Brontie gifts and voucher activity.</p>


      </div>

      <DashboardMetrics 
        totalGiftsCount={(dashboardData?.activeVouchers || 0) + (dashboardData?.redeemedVouchers || 0)}
        activeVouchersCount={dashboardData?.activeVouchers || 0}
        redeemedCount={dashboardData?.redeemedVouchers || 0}
        availableBalance={dashboardData?.availableForPayout || 0}
        totalPaidOut={dashboardData?.paidOutValue || 0}
        nextPayoutDate={getNextPayoutDate()}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 flex flex-col">
          <RecentRedemptionsTable redemptions={dashboardData?.recentRedemptions || []} />
          <RecentPurchasesList purchases={dashboardData?.recentPurchases || []} />
          <ValidateVoucherBlock />
          <FeedbackBlock />
        </div>

        <div className="lg:col-span-4 flex flex-col">
          <DashboardCharts 
            dailyActivity={dashboardData?.dailyActivity || []} 
            topSellingItem={dashboardData?.topSellingItems?.[0]}
          />
        </div>
      </div>
      
      {showModal && selectedVoucher && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  {selectedVoucher.status === 'unredeemed' ? 'Active Voucher Details' : 'Redeemed Voucher Details'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 hover:bg-gray-200 rounded-full p-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wider">Gift Item</h4>
                  <div className="flex items-start space-x-4">
                    {selectedVoucher.giftItemImage && (
                      <img
                        src={selectedVoucher.giftItemImage}
                        alt={selectedVoucher.giftItemName}
                        className="w-16 h-16 object-cover rounded-xl shadow-sm"
                      />
                    )}
                    <div className="flex-1">
                      <h5 className="font-bold text-gray-900 text-lg">{selectedVoucher.giftItemName}</h5>
                      <p className="text-sm text-gray-500 mt-1">{selectedVoucher.giftItemDescription}</p>
                      <p className="text-xl font-bold text-[#6ca3a4] mt-2">€{selectedVoucher.giftItemPrice.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wider">Purchase Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex flex-col"><span className="text-gray-500 text-xs">From</span><span className="font-bold text-gray-800">{selectedVoucher.senderName}</span></div>
                      <div className="flex flex-col"><span className="text-gray-500 text-xs">To</span><span className="font-bold text-gray-800">{selectedVoucher.recipientName}</span></div>
                      <div className="flex flex-col"><span className="text-gray-500 text-xs">Email</span><span className="font-bold text-gray-800">{selectedVoucher.recipientEmail}</span></div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs">Date</span>
                        <span className="font-bold text-gray-800">
                          {new Date(selectedVoucher.purchaseDate).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedVoucher.status === 'redeemed' && selectedVoucher.redemptionDate && (
                    <div className="bg-green-50/50 rounded-xl p-4 border border-green-100">
                      <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wider">Redemption Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex flex-col"><span className="text-gray-500 text-xs">Status</span><span className="font-bold text-green-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span>Redeemed</span></div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs">Date</span>
                          <span className="font-bold text-gray-800">
                            {new Date(selectedVoucher.redemptionDate).toLocaleDateString('en-GB', {
                              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedVoucher.status === 'unredeemed' && (
                    <div className="bg-yellow-50/50 rounded-xl p-4 border border-yellow-100">
                      <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wider">Status</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex flex-col"><span className="text-gray-500 text-xs">Status</span><span className="font-bold text-yellow-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span>Active</span></div>
                        <div className="flex flex-col"><span className="text-gray-500 text-xs">Action Required</span><span className="font-medium text-gray-700">Waiting for redemption</span></div>
                      </div>
                    </div>
                  )}
                </div>

                {selectedVoucher.message && (
                  <div className="bg-[#fff9eb] rounded-xl p-4 border border-[#fde6b3]">
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wider">Personal Message</h4>
                    <p className="text-gray-800 italic pr-4">&quot;{selectedVoucher.message}&quot;</p>
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={closeModal}
                  className="bg-[#6ca3a4] text-white px-6 py-2.5 rounded-xl hover:bg-[#568586] transition-colors font-bold shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CafeDashboardLayout>
  );
}