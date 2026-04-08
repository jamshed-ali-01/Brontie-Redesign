import React from 'react';
import { TrendingUp } from 'lucide-react';
import Image from 'next/image';

interface DailyActivity {
  date: string;
  purchased: number;
  redeemed: number;
}

interface TopSellingItem {
  name: string;
  sales: number;
  revenue: number;
}

interface DashboardChartsProps {
  dailyActivity: DailyActivity[];
  topSellingItem?: TopSellingItem;
}

export default function DashboardCharts({ dailyActivity, topSellingItem }: DashboardChartsProps) {
  const maxActivity = dailyActivity && dailyActivity.length > 0 
    ? Math.max(...dailyActivity.map(d => Math.max(d.purchased || 0, d.redeemed || 0))) 
    : 10;
  
  const yAxisTicks = [maxActivity, Math.round(maxActivity * 0.75), Math.round(maxActivity * 0.5), Math.round(maxActivity * 0.25), 0];
  
  const getDayName = (dateStr: string) => {
    if (!dateStr) return 'Day';
    const day = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
    return day;
  };

  return (
    <div className="space-y-6">
      {/* 7-Day Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-6">7-Day Activity</h3>
        
        <div className="h-48 flex mb-6">
          {/* Y Axis */}
          <div className="flex flex-col justify-between text-[10px] text-gray-400 pr-4 w-8">
            {yAxisTicks.map((tick, i) => (
              <span key={i}>{tick}</span>
            ))}
          </div>
          
          {/* Chart Area */}
          <div className="flex-1 flex justify-around items-end relative border-l border-b border-gray-100 pb-2">
            {dailyActivity && dailyActivity.length > 0 ? (
              dailyActivity.map((day, i) => {
                const pHeight = maxActivity > 0 ? ((day.purchased || 0) / maxActivity) * 100 : 0;
                const rHeight = maxActivity > 0 ? ((day.redeemed || 0) / maxActivity) * 100 : 0;
                
                return (
                  <div key={i} className="flex flex-col items-center group relative w-full h-full justify-end px-1">
                    <div className="flex items-end gap-1 w-full justify-center h-[calc(100%-8px)]">
                      {/* Purchased Bar */}
                      <div 
                        className="w-[6px] md:w-2 bg-[#6ca3a4] rounded-t-sm" 
                        style={{ height: `${Math.max(pHeight, 2)}%` }}
                        title={`Purchased: ${day.purchased || 0}`}
                      ></div>
                      {/* Redeemed Bar */}
                      <div 
                        className="w-[6px] md:w-2 bg-[#f4c24d] rounded-t-sm" 
                        style={{ height: `${Math.max(rHeight, 2)}%` }}
                        title={`Redeemed: ${day.redeemed || 0}`}
                      ></div>
                    </div>
                    {/* X Axis Label */}
                    <span className="text-[10px] text-gray-400 mt-2 absolute -bottom-6">
                      {getDayName(day.date)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 italic">
                No activity data
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center items-center gap-6 mt-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#f4c24d]"></div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Purchased</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#6ca3a4]"></div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Redeemed</span>
          </div>
        </div>

        <div className="mt-6 text-center text-[10px] font-medium text-gray-800">
          7-Day Activity · Redemptions +12% vs last week
        </div>
      </div>

      {/* Top Seller */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-44 bg-gray-100 relative">
          <Image 
            src="/images/onboarding/top-seller-placeholder.jpg" 
            alt="Top Seller"
            fill
            className="object-cover"
          />
        </div>
        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[9px] font-bold text-[#f4c24d] bg-[#fff9eb] border border-[#fde6b3] px-2 py-1 rounded uppercase tracking-wider">
              Top Seller
            </span>
            <span className="text-3xl font-bold text-gray-900 leading-none">
              {topSellingItem?.sales || 0}
            </span>
          </div>
          
          <h4 className="text-sm font-bold text-gray-900 mt-1">
            {topSellingItem?.name || 'Loading...'}
          </h4>
          <p className="text-[11px] text-gray-500">Gifts Sent This Month</p>
          
          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-[#6ca3a4]">
             <span className="text-xs font-bold">Growth: +24%</span>
             <TrendingUp className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
      </div>
    </div>
  );
}
