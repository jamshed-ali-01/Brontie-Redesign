'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Ticket, 
  Coffee, 
  Banknote, 
  Megaphone, 
  Store, 
  Building2, 
  Settings,
  Download,
  CreditCard,
  QrCode
} from 'lucide-react';

export default function CafeSidebar() {
  const pathname = usePathname();

  const primaryLinks = [
    { name: 'Overview', href: '/cafes/dashboard', icon: LayoutDashboard },
    { name: 'Vouchers', href: '/cafes/vouchers', icon: Ticket },
    { name: 'Menu Items', href: '/cafes/items', icon: Coffee },
    { name: 'Payouts', href: '/cafes/analytics/funnel', icon: Banknote },
    { name: 'Marketing Assets', href: '#', icon: Megaphone },
    { name: 'Refer a Cafe', href: '#', icon: Store },
    { name: 'Refer an Organization', href: '#', icon: Building2 },
    { name: 'Settings', href: '/cafes/settings', icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-[64px] bottom-0 w-[260px] bg-[#fdfdfd] border-r border-gray-100 overflow-y-auto hidden lg:flex flex-col z-40">
      <nav className="flex-1 px-4 py-8 space-y-1">
        {primaryLinks.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                isActive 
                  ? 'bg-[#f0f4f4] text-[#4a7273]' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`mr-3 w-5 h-5 flex-shrink-0 ${isActive ? 'stroke-[#6ca3a4]' : 'stroke-gray-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Counter Assets Section */}
      <div className="px-6 py-6 border-t border-gray-100">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">
          Counter Assets
        </h4>
        
        <div className="space-y-4">
          {/* QR Sign */}
          <div className="bg-[#f9fafb] p-4 rounded-2xl border border-gray-100">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-gray-200/50 rounded-lg shrink-0">
                <QrCode className="w-5 h-5 stroke-gray-500" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-gray-800">QR Sign</h5>
                <p className="text-[10px] text-gray-500 leading-tight mt-0.5">Printable A5 QR sign for your café counter.</p>
              </div>
            </div>
            <button className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
          </div>

          {/* Counter Card */}
          <div className="bg-[#fefce8] p-4 rounded-2xl border border-yellow-100">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-yellow-100 rounded-lg shrink-0">
                <CreditCard className="w-5 h-5 stroke-yellow-600" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-gray-800">Counter Card</h5>
                <p className="text-[10px] text-gray-500 leading-tight mt-0.5">A pre-printed tent card for your counter</p>
              </div>
            </div>
            <button className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#f4c24d] rounded-xl text-xs font-bold text-[#2c3e50] hover:bg-[#e5b54d] transition-colors shadow-sm">
              Order Free Now <span className="text-lg leading-none ml-1">→</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
