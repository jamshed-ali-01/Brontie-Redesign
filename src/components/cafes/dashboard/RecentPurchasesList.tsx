import React from 'react';
import { ShoppingBag } from 'lucide-react';

interface Purchase {
  date: string;
  item: string;
  value: number;
  sender: string;
  recipient: string;
}

interface RecentPurchasesListProps {
  purchases: Purchase[];
}

export default function RecentPurchasesList({ purchases }: RecentPurchasesListProps) {
  // Take only top 3 for overview
  const displayPurchases = purchases.slice(0, 3);
  
  const formatDateOnly = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full mb-6 relative">
      <h3 className="text-sm font-bold text-gray-900 mb-6">Recent Purchases</h3>

      <div className="space-y-5">
        {displayPurchases.length > 0 ? (
          displayPurchases.map((p, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#fff9eb] border border-[#fde6b3] flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4 text-[#f4c24d] stroke-[2.5]" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-gray-900 truncate">{p.item}</h4>
                <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                  Purchased by <span className="font-semibold text-gray-700">{p.sender}</span> for <span className="font-semibold text-gray-700">{p.recipient}</span>
                </p>
              </div>
              <div className="text-xs font-bold text-gray-900 shrink-0">
                {formatDateOnly(p.date)}
              </div>
            </div>
          ))
        ) : (
           <div className="text-center text-gray-400 py-4 text-xs italic">No recent purchases</div>
        )}
      </div>
    </div>
  );
}
