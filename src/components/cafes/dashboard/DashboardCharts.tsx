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
    : 60;
  
  // Create 6 ticks exactly dividing maxActivity, ending at a sensible number.
  // E.g. if maxActivity is 45, make actualMax 60.
  const step = Math.max(10, Math.ceil(maxActivity / 6 / 10) * 10);
  const actualMax = step * 6;
  const yAxisTicks = [step * 6, step * 5, step * 4, step * 3, step * 2, step];
  
  const getDayName = (dateStr: string) => {
    if (!dateStr) return 'Day';
    const day = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
    return day;
  };

  return (
    <div className="space-y-6">
      {/* 7-Day Activity */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-50 p-4 sm:p-6">
        <h3 className="text-sm sm:text-[14px] font-bold text-[#1c2b36] mb-6 sm:mb-8">7-Day Activity</h3>
        
        <div className="h-44 flex mb-8 pr-2">
          {/* Y Axis */}
          <div className="flex flex-col justify-between text-[11px] text-[#9fb3be] font-medium pr-3 w-8 items-end">
            {yAxisTicks.map((tick, i) => (
              <span key={i}>{tick}</span>
            ))}
          </div>
          
          {/* Chart Area */}
          <div className="flex-1 flex justify-between items-end relative pb-0">
            {dailyActivity && dailyActivity.length > 0 ? (
              dailyActivity.map((day, i) => {
                const pHeight = actualMax > 0 ? ((day.purchased || 0) / actualMax) * 100 : 0;
                const rHeight = actualMax > 0 ? ((day.redeemed || 0) / actualMax) * 100 : 0;
                
                return (
                  <div key={i} className="flex flex-col items-center group relative w-full h-full justify-end px-1">
                    <div className="flex items-end gap-[4px] w-full justify-center h-full">
                      {/* Redeemed Bar - Teal (Left in UI) */}
                      <div 
                        className="w-[5px] md:w-[7px] bg-[#759c9a] rounded-t-full" 
                        style={{ height: `${Math.max(rHeight, 2)}%` }}
                        title={`Redeemed: ${day.redeemed || 0}`}
                      ></div>
                      {/* Purchased Bar - Yellow (Right in UI) */}
                      <div 
                        className="w-[5px] md:w-[7px] bg-[#f3e4b7] rounded-t-full" 
                        style={{ height: `${Math.max(pHeight, 2)}%` }}
                        title={`Purchased: ${day.purchased || 0}`}
                      ></div>
                    </div>
                    {/* X Axis Label */}
                    <span className="text-[11px] font-medium text-[#9fb3be] mt-3 absolute -bottom-7">
                      {getDayName(day.date)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[11px] text-gray-400 italic">
                No activity data
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center items-center gap-6 mt-12 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#f3e4b7]"></div>
            <span className="text-[12px] text-[#718596] font-medium">Purchased</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#759c9a]"></div>
            <span className="text-[12px] text-[#718596] font-medium">Redeemed</span>
          </div>
        </div>

        <div className="text-center text-[10px] sm:text-[11px] text-[#1c2b36] font-medium tracking-wide">
          7-Day Activity · Redemptions +12% vs last week
        </div>
      </div>

      {/* Top Seller */}
      <div className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-50 overflow-hidden">
        <div className="h-44 bg-gray-100 relative">
          <Image 
            src="/images/growth.png" 
            alt="Top Seller"
            fill
            className="object-cover"
          />
        </div>
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-[#f4c24d] bg-[#fffbf0] border border-[#fde6b3] px-2 py-0.5 rounded tracking-wider uppercase">
              Top Seller
            </span>
            <span className="text-3xl font-bold text-gray-900 leading-none">
              {topSellingItem?.sales || 0}
            </span>
          </div>
          
          <h4 className="text-base font-bold text-gray-900 mt-1">
            {topSellingItem?.name || 'Coffee + Cake'}
          </h4>
          <p className="text-sm text-gray-500">Gifts Sent This Month</p>
          
          <div className="mt-5 pt-4 border-t border-gray-50 flex justify-between items-center ">
             <span className="text-[12px] font-bold text-[#6ca3a4]">Growth: +24%</span>
             <TrendingUp className="w-4 h-4 stroke-[2]" color='#6ca3a4' />
          </div>
        </div>
      </div>
    </div>
  );
}
