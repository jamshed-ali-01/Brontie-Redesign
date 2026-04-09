import React from 'react';
import { Gift, Coffee, CheckCircle, Wallet, Lightbulb } from 'lucide-react';

interface MetricProps {
  title: string;
  value: string | number;
  subValue?: string;
  subText?: string;
  icon: React.ReactNode;
  trendText?: string;
  trendIsPositive?: boolean;
}

function MetricCard({ title, value, subValue, subText, icon, trendText, trendIsPositive }: MetricProps) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-50 p-6 flex flex-col h-full">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xs font-semibold text-gray-500">{title}</h3>
        <div className="text-[#f4c24d]">{icon}</div>
      </div>
      <div className="mt-auto flex flex-col gap-1">
        <div className="text-[32px] font-bold text-gray-900 leading-tight tracking-tight">{value}</div>
        {subValue && <div className="text-[11px] text-gray-400 font-medium">{subValue}</div>}
        {subText && <div className="text-[11px] text-gray-400 font-medium">{subText}</div>}
        {trendText && (
          <div className={`text-[11px] font-bold ${trendIsPositive ? 'text-[#38c172]' : 'text-gray-500'}`}>
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
          icon={<Gift className="w-5 h-5 stroke-[1.5]" />}
        />
        <MetricCard 
          title="Active Vouchers" 
          value={activeVouchersCount} 
          subValue="Waiting for redemption"
          trendText="+10 vouchers this month"
          trendIsPositive={true}
          icon={<Coffee className="w-5 h-5 stroke-[1.5]" />}
        />
        <MetricCard 
          title="Redeemed" 
          value={redeemedCount} 
          subValue="Completed visits"
          icon={<CheckCircle className="w-5 h-5 stroke-[1.5]" />}
        />
        <MetricCard 
          title="Available Balance" 
          value={`€${availableBalance.toFixed(0)}`} 
          subValue={`Total paid out €${totalPaidOut.toLocaleString()}`}
          subText={`Next payout: ${nextPayoutDate}`}
          icon={<Wallet className="w-5 h-5 stroke-[1.5]" />}
        />
      </div>

      <div className="bg-[#fffbf0] border border-[#fde6b3] rounded-xl p-4 flex items-start gap-3 shadow-sm mx-auto">
        <div className="text-[#f4c24d] mt-0.5 shrink-0">
          <Lightbulb className="w-5 h-5 stroke-[2]" />
        </div>
        <div className="text-[13px] text-gray-800 leading-snug">
          <span className="font-bold">Tip: </span> Coffee + Cake sells 40% more than coffee alone. Consider promoting it in your café.
        </div>
      </div>
    </div>
  );
}
