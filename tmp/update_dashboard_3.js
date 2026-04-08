const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/app/cafes/dashboard/page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. imports
content = content.replace(
  /import \{(.|\n|\r)*?\} from '@heroicons\/react\/24\/outline';/,
  `import CafeDashboardLayout from '@/components/cafes/layout/CafeDashboardLayout';
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
});`
);

// 2. loading String replacement
const loadingStr = `<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>`;

content = content.replace(loadingStr, `<div className="w-12 h-12 border-4 border-[#6ca3a4] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium tracking-wide">Loading your dashboard...</p>`);

// 3. error String replacement
const errorStr = `className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"`;
content = content.replace(errorStr, `className="bg-[#6ca3a4] text-white font-bold px-4 py-2 rounded-xl hover:bg-[#568586] transition-colors"`);

// 4. Locate handleLogout properly, and replace everything after it finishes
const handleLogoutIdx = content.indexOf('const handleLogout = async () => {');
if (handleLogoutIdx !== -1) {
  const routerPushIdx = content.indexOf('router.push(\'/cafes/login\');', handleLogoutIdx);
  const routerPush2Idx = content.indexOf('router.push(\'/cafes/login\');', routerPushIdx + 1);
  const routerPush3Idx = content.indexOf('router.push(\'/cafes/login\');', routerPush2Idx + 1);
  
  // The end of handleLogout is roughly right after the third push and its closing braces.
  // Original is:
  //     } catch (error) {
  //       console.error('Logout error:', error);
  //       router.push('/cafes/login');
  //     }
  //   };
  // We can just find `\n  };\n` after routerPush3Idx.
  const endLogoutIdx = content.indexOf('  };\n', routerPush3Idx);
  if (endLogoutIdx !== -1) {
    const spliceIndex = endLogoutIdx + 5; // right after "};\n"
    
    const newReturn = `
  return (
    <CafeDashboardLayout cafeName={dashboardData?.payoutDetails?.accountHolderName || 'Cafe Name'} ownerName={dashboardData?.payoutDetails?.accountHolderName || 'User'}>
      <div className="mb-8">
        <h1 className={\`text-4xl text-[#6ca3a4] mb-2 \${lobster.className}\`}>Café Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of your Brontie gifts and voucher activity.</p>

        {(!dashboardData?.stripeConnectSettings?.isConnected && (!dashboardData?.payoutDetails?.accountHolderName || !dashboardData?.payoutDetails?.iban)) && (
          <div className="bg-gradient-to-r from-yellow-50 to-purple-50 border border-yellow-200 rounded-lg p-6 my-8">
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

        {(!dashboardData?.squareCredentials?.isConfigured) && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mb-8 mt-4">
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
`;

    content = content.substring(0, spliceIndex) + newReturn;

  }
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Update Script 3 Executed Successfully!');
