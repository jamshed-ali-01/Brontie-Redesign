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
    const date = d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
    return `${date} · ${time}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-gray-900">Recent Redemptions</h3>
        <Link href="#" className="text-xs font-bold text-[#6ca3a4] hover:text-[#568586]">
          View All
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100/60 pb-3 block mb-3">
              <th className="text-[10px] uppercase font-bold text-gray-400 w-[35%] tracking-wider">Item</th>
              <th className="text-[10px] uppercase font-bold text-gray-400 w-[25%] tracking-wider">Location</th>
              <th className="text-[10px] uppercase font-bold text-gray-400 w-[25%] tracking-wider">Date/Time</th>
              <th className="text-[10px] uppercase font-bold text-gray-400 w-[15%] text-right tracking-wider">Value</th>
            </tr>
          </thead>
          <tbody className="space-y-4 block">
            {displayRedemptions.length > 0 ? (
              displayRedemptions.map((r, idx) => (
                <tr key={idx} className="flex items-center text-xs">
                  <td className="w-[35%] font-semibold text-gray-800 truncate pr-2">{r.item}</td>
                  <td className="w-[25%] text-gray-500 truncate pr-2">{r.location || 'Main Street'}</td>
                  <td className="w-[25%] text-gray-500 truncate pr-2">{formatDateTime(r.date)}</td>
                  <td className="w-[15%] text-right font-bold text-gray-900">€{r.value.toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center text-gray-400 py-4 italic">No recent redemptions</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
