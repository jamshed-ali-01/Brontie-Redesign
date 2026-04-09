import React from 'react';
import Link from 'next/link';

interface Redemption {
  date: string;
  item: string;
  value: number;
  location?: string;
}

interface RecentRedemptionsTableProps {
  redemptions: Redemption[];
}

export default function RecentRedemptionsTable({ redemptions }: RecentRedemptionsTableProps) {
  // Take only top 5 for overview
  const displayRedemptions = redemptions.slice(0, 5);

  const formatDateTime = (dateString: string) => {
    const d = new Date(dateString);
    const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
    return `${date} · ${time}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-50 p-6 flex flex-col h-full mb-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[13px] font-bold text-gray-900 tracking-wide">Recent Redemptions</h3>
        <Link href="#" className="text-[10px] font-bold text-[#6ca3a4] hover:text-[#568586]">
          View All
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr>
              <th className="text-[9px] uppercase font-bold text-gray-500 tracking-wider pb-4 w-[28%]">Item</th>
              <th className="text-[9px] uppercase font-bold text-gray-500 tracking-wider pb-4 w-[22%]">Location</th>
              <th className="text-[9px] uppercase font-bold text-gray-500 tracking-wider pb-4 w-[35%]">Date/Time</th>
              <th className="text-[9px] uppercase font-bold text-gray-500 tracking-wider pb-4 w-[15%] text-right">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 border-t border-gray-50">
            {displayRedemptions.length > 0 ? (
              displayRedemptions.map((r, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 pr-2 text-[12px] font-bold text-gray-900 truncate">{r.item}</td>
                  <td className="py-4 pr-2 text-[11px] font-medium text-gray-500 truncate">{r.location || 'Main Street'}</td>
                  <td className="py-4 pr-2 text-[11px] font-medium text-gray-500 truncate">{formatDateTime(r.date)}</td>
                  <td className="py-4 text-right text-[12px] font-bold text-gray-900">€{r.value.toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center text-gray-400 py-6 italic text-xs">No recent redemptions</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
