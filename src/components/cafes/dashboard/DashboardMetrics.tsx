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
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-50 p-4 sm:p-6 flex flex-col h-full">
      <div className="flex justify-between items-start mb-2 sm:mb-3">
        <h3 className="text-xs sm:text-[14px] font-semibold text-gray-500 line-clamp-1">{title}</h3>
        <div className="text-[#f4c24d]">{icon}</div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-xl sm:text-[28px] font-bold text-gray-900 leading-tight tracking-tight truncate">{value}</div>

         
        {subValue && <div className="text-[10px] sm:text-[12px] text-gray-400 font-medium truncate">{subValue}</div>}
        {subText && <div className="text-[10px] sm:text-[12px] text-gray-400 font-medium truncate">{subText}</div>}
        {trendText && (
          <div className={`text-[10px] sm:text-[12px] font-bold truncate ${trendIsPositive ? 'text-[#38c172]' : 'text-gray-500'}`}>
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
  trends?: {
    giftsLast30Days: number;
    redeemedLast30Days: number;
  };
}

export default function DashboardMetrics({
  totalGiftsCount,
  activeVouchersCount,
  redeemedCount,
  availableBalance,
  totalPaidOut,
  nextPayoutDate,
  trends
}: DashboardMetricsProps) {
  const giftsTrendRaw = trends?.giftsLast30Days || 0;
  const giftsTrendText = giftsTrendRaw > 0 ? `+${giftsTrendRaw} this month` : 'No new gifts this month';

  const redeemedTrendRaw = trends?.redeemedLast30Days || 0;
  const redeemedTrendText = redeemedTrendRaw > 0 ? `+${redeemedTrendRaw} this month` : 'No redemptions this month';
  
  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard 
          title="Total Gifts Sent" 
          value={totalGiftsCount} 
          trendText={giftsTrendText}
          trendIsPositive={giftsTrendRaw > 0}
          icon={<Gift  color='#f4c24d' className="w-5 h-5 stroke-[1.5]" />}
        />
        <MetricCard 
          title="Active Vouchers" 
          value={activeVouchersCount} 
          subValue="Waiting for redemption"
          icon={<Coffee color='#f4c24d' className="w-5 h-5 stroke-[1.5]" />}
        />
        <MetricCard 
          title="Redeemed" 
          value={redeemedCount} 
          subValue="Completed visits"
          trendText={redeemedTrendText}
          trendIsPositive={redeemedTrendRaw > 0}
          icon={<CheckCircle color='#f4c24d'  className="w-5 h-5 stroke-[1.5]" />}
        />
        <MetricCard 
          title="Available Balance" 
          value={`€${availableBalance.toFixed(0)}`} 
          subValue={`Total paid out €${totalPaidOut.toLocaleString()}`}
          subText={`Next payout: ${nextPayoutDate}`}
          icon={<Wallet color='#f4c24d'  className="w-5 h-5 stroke-[1.5]" />}
        />
      </div>

      <div className="bg-[#fffbf0] border-l-6 border-[#fde6b3] rounded-xl p-4 flex items-start gap-3 shadow-sm mx-auto">
        <div className="text-[#f4c24d] mt-0.5 shrink-0">
          <Lightbulb color='#f4c24d'  className="w-5 h-5 stroke-[2]" />
        </div>
        <div className="text-[14px] text-gray-800 leading-snug">
          <span className="font-bold">Tip: </span> Coffee + Cake sells 40% more than coffee alone. Consider promoting it in your café.
        </div>
      </div>
    </div>
  );
}
