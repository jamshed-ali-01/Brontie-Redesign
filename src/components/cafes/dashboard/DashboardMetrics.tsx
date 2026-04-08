import React from 'react';
import { Gift, Coffee, CheckCircle, Wallet, Lightbulb } from 'lucide-react';

interface MetroProps {
  title: string;
  value: string | number;
  subValue?: string;
  subText?: string;
  icon: React.ReactNode;
  trendText?: string;
  trendIsPositive?: boolean;
}

function MetricCard({ title, value, subValue, subText, icon, trendText, trendIsPositive }: MetroProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">{title}</h3>
        <div className="text-[#f4c24d]">{icon}</div>
      </div>
      <div className="mt-auto">
        <div className="text-[32px] font-bold text-gray-900 leading-none mb-2">{value}</div>
        {subValue && <div className="text-[11px] text-gray-500 mb-1">{subValue}</div>}
        {subText && <div className="text-[11px] text-gray-400">{subText}</div>}
        {trendText && (
          <div className={`text-[11px] font-medium mt-2 ${trendIsPositive ? 'text-green-500' : 'text-gray-500'}`}>
            {trendText}
          </div>
        )}
      </div>
    </div>
  );
}

interface DashboardMetricsProps {
  totalGiftsCount: number;
  activeVouchersCount: number;
  redeemedCount: number;
  availableBalance: number;
  totalPaidOut: number;
  nextPayoutDate: string;
}

export default function DashboardMetrics({
  totalGiftsCount,
  activeVouchersCount,
  redeemedCount,
  availableBalance,
  totalPaidOut,
  nextPayoutDate
}: DashboardMetricsProps) {
  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Gifts Sent" 
          value={totalGiftsCount} 
          trendText="+12% from last month"
          trendIsPositive={true}
          icon={<Gift className="w-5 h-5 stroke-[2]" />}
        />
        <MetricCard 
          title="Active Vouchers" 
          value={activeVouchersCount} 
          subValue="Waiting for redemption"
          trendText="+10 vouchers this month"
          trendIsPositive={true}
          icon={<Coffee className="w-5 h-5 stroke-[2]" />}
        />
        <MetricCard 
          title="Redeemed" 
          value={redeemedCount} 
          subValue="Completed visits"
          icon={<CheckCircle className="w-5 h-5 stroke-[2]" />}
        />
        <MetricCard 
          title="Available Balance" 
          value={`€${availableBalance.toFixed(0)}`} 
          subValue={`Total paid out €${totalPaidOut.toLocaleString()}`}
          subText={`Next payout: ${nextPayoutDate}`}
          icon={<Wallet className="w-5 h-5 stroke-[2]" />}
        />
      </div>

      <div className="bg-[#fff9eb] border border-[#fde6b3] rounded-xl p-4 flex items-start gap-4 shadow-sm">
        <div className="text-[#f4c24d] mt-0.5">
          <Lightbulb className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div className="text-sm text-gray-800">
          <span className="font-bold">Tip: </span> Coffee + Cake sells 40% more than coffee alone. Consider promoting it in your café.
        </div>
      </div>
    </div>
  );
}
