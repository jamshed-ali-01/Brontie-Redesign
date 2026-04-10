'use client';

import { useEffect, useState } from 'react';
import CafeDashboardLayout from '@/components/cafes/layout/CafeDashboardLayout';
import { Lobster } from 'next/font/google';
import { Gift, Calendar, CheckCircle, Wallet, Download, FileText } from 'lucide-react';

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

// Using same data structures from the dashboard
interface DashboardData {
  merchantName?: string;
  merchantLogo?: string;
  availableForPayout: number;
  paidOutValue: number;
  payoutSummary: {
    grossTotal: number;
    totalStripeFees: number;
    netAfterStripe: number;
    platformFee: number;
  };
  payoutTransactions?: Array<{
    itemName: string;
    date: string;
    grossPrice: number;
    stripeFee: number;
    platformFee?: number;
    netAfterStripe: number;
  }>;
  payoutDetails?: {
    accountHolderName: string;
  };
}

export default function CafePayoutsPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [lastPayoutDate, setLastPayoutDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMergedData = async () => {
    try {
      const [dashRes, payoutsRes] = await Promise.all([
        fetch('/api/cafes/dashboard'),
        fetch('/api/cafes/analytics/payouts')
      ]);
      
      if (dashRes.ok) {
        const data = await dashRes.json();
        setDashboardData(data);
      }
      
      if (payoutsRes.ok) {
        const pData = await payoutsRes.json();
        if (pData.success && pData.data?. সাম্প্রতিকPayouts?.length > 0) {
          // Fallback if needed, but the actual key is recentPayouts
        }
        if (pData.success && pData.data?.recentPayouts?.length > 0) {
          const sortedPayouts = [...pData.data.recentPayouts].sort((a,b) => new Date(b.paidOutAt).getTime() - new Date(a.paidOutAt).getTime());
          setLastPayoutDate(new Date(sortedPayouts[0].paidOutAt));
        }
      }
    } catch (err) {
      console.error('Error loading payouts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchMergedData(); 
  }, []);

  // Extracted helper
  const getNextPayoutDate = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 5 = Friday

    let daysUntilFriday = 5 - currentDay;
    if (daysUntilFriday <= 0) daysUntilFriday += 7;

    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + daysUntilFriday);

    const weekOfMonth = Math.ceil((nextFriday.getDate() - 1) / 7);

    if (weekOfMonth === 2 || weekOfMonth === 4) {
      return nextFriday;
    }

    let targetWeek = weekOfMonth < 2 ? 2 : 4;
    if (weekOfMonth > 4) {
      targetWeek = 2;
      nextFriday.setMonth(nextFriday.getMonth() + 1);
    }

    const targetDate = new Date(nextFriday);
    targetDate.setDate(1 + (targetWeek - 1) * 7);

    const dayOfWeek = targetDate.getDay();
    const daysToAdd = dayOfWeek <= 5 ? 5 - dayOfWeek : 12 - dayOfWeek;
    targetDate.setDate(targetDate.getDate() + daysToAdd);

    return targetDate;
  };

  const nextPayoutDateObj = getNextPayoutDate();
  const nextPayoutDisplay = nextPayoutDateObj.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  const nextPayoutLong = nextPayoutDateObj.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  // Fake calculation for the deadline text
  const getDeadlineText = () => {
    const deadline = new Date(nextPayoutDateObj);
    deadline.setDate(deadline.getDate() - 1);
    return `Includes all redemptions up to ${deadline.toLocaleDateString('en-GB', {weekday: 'long', day: 'numeric', month: 'long'})} (11:59 PM)`;
  };


  if (loading) {
    return (
      <CafeDashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[#f4c24d] rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-2 border-4 border-gray-100 rounded-full"></div>
            <div className="absolute inset-2 border-4 border-[#6ca3a4] rounded-full border-t-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <h3 className="text-[16px] font-bold text-gray-800 tracking-wide">Loading earnings...</h3>
          <p className="mt-2 text-[12px] text-gray-500 font-medium">Please wait a moment.</p>
        </div>
      </CafeDashboardLayout>
    );
  }

  const availBalance = dashboardData?.availableForPayout || 0;
  const totPaidOut = dashboardData?.paidOutValue || 0;
  
  const grossMonth = dashboardData?.payoutSummary?.grossTotal || 0;
  const feesMonth = dashboardData?.payoutSummary?.totalStripeFees || 0;
  const brontieFeeMonth = dashboardData?.payoutSummary?.platformFee || 0;
  const netPaidMonth = (grossMonth - feesMonth - brontieFeeMonth) > 0 ? (grossMonth - feesMonth - brontieFeeMonth) : 0;

  const transactions = dashboardData?.payoutTransactions || [];

  return (
    <CafeDashboardLayout>
      <div className="pb-8">
        <h1 className={`text-[42px] tracking-tight text-[#6ca3a4] mb-2 ${lobster.className}`}>Earnings & Payouts</h1>
        <p className="text-[14px] font-medium text-[#879bb1] mb-8">Track your earnings and view scheduled transfers to your account</p>

        {/* Top 4 KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-50 p-5 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-[#94A3B8] tracking-wide">Available Balance</h3>
              <Gift className="size-5 stroke-[2]" color='#f4c24d' />
            </div>
            <div className="text-[24px] font-semibold text-gray-900 leading-none">€ {availBalance.toFixed(2)}</div>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-50 p-5 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-[#94A3B8] tracking-wide">Next Payout</h3>
              <Calendar className="size-5 stroke-[2] " color='#f4c24d' />
            </div>
            <div className="text-[16px] font-semibold text-gray-900 leading-none mt-auto mb-1">{nextPayoutDisplay}</div>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-50 p-5 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-[#94A3B8] tracking-wide">Last Payout</h3>
              <CheckCircle className="size-5 stroke-[2]" color='#f4c24d' />
            </div>
            <div className="text-[16px] font-semibold text-gray-900 leading-none mt-auto mb-1">
              {lastPayoutDate ? lastPayoutDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : 'No Payouts Yet'}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-50 p-5 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-[#94A3B8] tracking-wide">Total Paid out</h3>
              <Wallet className="size-5 stroke-[2]" color='#f4c24d' />
            </div>
            <div className="text-[24px] font-semibold text-gray-900 leading-none">€{(totPaidOut.toLocaleString(undefined, {minimumFractionDigits: 2}))}</div>
          </div>
        </div>

       
        {/* Main Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 flex flex-col">

             {/* Schedule Info Box */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-50 flex overflow-hidden mb-4 relative">
          <div className="w-[6px] bg-[#f4c24d] absolute top-0 bottom-0 left-0"></div>
          <div className="pl-6 p-5 flex items-center gap-5 w-full">
            <div className="w-12 h-12 rounded-full bg-[#fffbf0] flex items-center justify-center shrink-0">
               <Calendar className="w-5 h-5 text-[#f4c24d] stroke-[2]"  color='#f4c24d'/>
            </div>
            <div>
              <p className="text-sm font-medium text-[#94A3B8] leading-tight">Your next payout is scheduled for</p>
              <h3 className="text-xl font-bold text-gray-900 mt-1">{nextPayoutLong}</h3>
              <p className="text-xs text-[#94A3B8] mt-1 font-medium">{getDeadlineText()}</p>
            </div>
          </div>
        </div>

            
            {/* Redeemed this Month & Payouts Table combined card */}
            <div className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-50 flex flex-col overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Total Redeemed This Month</h3>
                
                <div className="space-y-4 text-base   text-[#475569] mb-8">
                  <div className="flex justify-between items-center">
                    <span className='font-light'>Gross Redemptions</span>
                    <span className="font-semibold text-gray-900">€{grossMonth.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className='font-light'>Payment Processing Fees</span>
                    <span className="font-semibold text-[#ff5b5b]">-€{feesMonth.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className='font-light'>Brontie Commission</span>
                    <span className="font-semibold text-[#ff5b5b]">-€{brontieFeeMonth.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-2 mb-2">
                  <h4 className="text-lg font-bold text-gray-900">Net Paid to Café</h4>
                  <div className="bg-[#fff9eb] text-[#f4c24d] px-4 py-2 rounded-xl text-[20px] font-bold border border-[#fff2cc]">
                    €{netPaidMonth.toFixed(2)}
                  </div>
                </div>
              </div>

              

              {/* Payouts Table inside same card */}
              <div className="pt-4 pb-2">
                <h3 className="text-[16px] font-semibold text-gray-900 mb-6 px-4 sm:px-6 tracking-wide">Payouts</h3>
                
                <div className="overflow-x-auto w-full">
                  <div className="min-w-[650px] px-4 sm:px-6 mb-4">
                    <table className="w-full text-left border-collapse rounded-xl overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.02)]">
                      <thead>
                        <tr className="bg-[#fcfdfd]">
                        <th className="text-[10px] uppercase font-bold text-[#879bb1] tracking-wider py-4 pl-6 w-[25%] relative rounded-tl-xl border-b border-gray-50">
                          Payout Date/Time
                        </th>
                        <th className="text-[10px] uppercase font-bold text-[#879bb1] tracking-wider py-4 w-[20%] border-b border-gray-50">Item Name</th>
                        <th className="text-[10px] uppercase font-bold text-[#879bb1] tracking-wider py-4 w-[15%] border-b border-gray-50">Gross Amount</th>
                        <th className="text-[10px] uppercase font-bold text-[#879bb1] tracking-wider py-4 w-[20%] border-b border-gray-50">Processing Fees</th>
                        <th className="text-[10px] uppercase font-bold text-[#879bb1] tracking-wider py-4 w-[15%] pr-6 rounded-tr-xl border-b border-gray-50">Net Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {transactions.length > 0 ? transactions.map((row, idx) => {
                        const rowDate = new Date(row.date);
                        const formattedDate = rowDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                        const formattedTime = rowDate.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
                        const brontieFee = row.platformFee || 0;
                        const finalNet = row.netAfterStripe - brontieFee;
                           
                        return (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-5 pl-6 pr-2 text-[12px] font-bold text-[#879bb1]">{formattedDate} · {formattedTime}</td>
                            <td className="py-5 pr-2 text-[12px] font-bold text-gray-900">{row.itemName || '1'}</td>
                            <td className="py-5 pr-2 text-[12px] font-bold text-[#879bb1]">€{row.grossPrice.toFixed(2)}</td>
                            <td className="py-5 pr-2 text-[12px] font-bold text-[#879bb1]">€{row.stripeFee.toFixed(2)}</td>
                            <td className="py-5 pr-6 text-[12px] font-bold text-[#879bb1]">€{finalNet.toFixed(2)}</td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-[13px] font-medium text-[#879bb1]">No payout history available</td>
                        </tr>
                      )}
                    </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-50 p-6 flex flex-col">
              <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-5 mb-2">Monthly Reports</h3>
              
              <div className="space-y-4">
                {[
                  { month: 'February 2026' },
                  { month: 'January 2026' },
                  { month: 'December 2025' },
                  { month: 'November 2025' },
                ].map((report, idx) => (
                  <div key={idx} className="flex justify-between items-center rounded-xl p-3 border border-transparent hover:border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-[10px] bg-[#f0f4f4] flex items-center justify-center shrink-0">
                         <FileText className="w-5 h-5 text-[#6ca3a4] stroke-[1.5]" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 leading-tight">{report.month}</h4>
                        <p className="text-xs  text-[#94A3B8] mt-0.5">Statement</p>
                      </div>
                    </div>
                    <button className="w-8 h-8 flex items-center justify-center text-[#a0b0c0] hover:text-[#6ca3a4] transition-colors shrink-0">
                      <Download className="size-6 stroke-[2]" color="#94A3B8" />
                    </button>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>

      </div>
    </CafeDashboardLayout>
  );
}


