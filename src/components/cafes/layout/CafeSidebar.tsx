'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  QrCode,
  LogOut,
  ArrowRight
} from 'lucide-react';

interface CafeSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function CafeSidebar({ isOpen = false, onClose }: CafeSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/cafe-logout', { method: 'POST' });
      router.push('/cafes/login');
    } catch (e) {
      router.push('/cafes/login');
    }
  };

  const primaryLinks = [
    { name: 'Overview', href: '/cafes/dashboard', icon: LayoutDashboard },
    { name: 'Vouchers', href: '/cafes/vouchers', icon: Ticket },
    { name: 'Menu Items', href: '/cafes/items', icon: Coffee },
    { name: 'Payouts', href: '/cafes/analytics/payouts', icon: Banknote },
    { name: 'Marketing Assets', href: '#', icon: Megaphone },
    { name: 'Refer a Cafe', href: '#', icon: Store },
    { name: 'Refer an Organization', href: '#', icon: Building2 },
    { name: 'Settings', href: '/cafes/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden top-[64px]"
          onClick={onClose}
        />
      )}

      <aside className={`fixed left-0 top-[64px] bottom-0 w-[260px] bg-[#fdfdfd] border-r border-gray-100 overflow-y-auto flex-col z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#6ca3a4]/30 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#6ca3a4]/50`}>
        <nav className="flex-1 px-4 py-8 space-y-1">
          {primaryLinks.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => onClose && onClose()}
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

          {/* Mobile Logout Option inline (only visible on mobile) */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 mt-4 text-sm font-medium rounded-xl text-red-500 hover:bg-red-50 transition-colors lg:hidden"
          >
            <LogOut className="mr-3 w-5 h-5 flex-shrink-0 stroke-red-400" />
            Sign Out
          </button>
        </nav>

        {/* Counter Assets Section */}
        <div className="px-6 py-6 border-t border-gray-100">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">
            Counter Assets
          </h4>
          
          <div className="space-y-4">
            {/* QR Sign */}
            <div className="bg-[#f8fafc] p-4 rounded-2xl border border-gray-100">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-[#6CA3A4]/10 rounded-lg shrink-0">
                  <QrCode className="w-5 h-5" color='#6CA3A4' />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-gray-800 mb-1 ">QR Sign</h5>
                  <p className="text-[10px] text-[#94A3B8] leading-tight mt-0.5">Printable A5 QR sign for your café counter.</p>
                </div>
              </div>
              <button className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white border border-[#6CA3A4] rounded-lg text-xs font-medium text-[#6CA3A4] hover:bg-gray-50 transition-colors shadow-sm">
                <Download className="w-3.5 h-3.5 stroke-[#6CA3A4]" />
                Download PDF
              </button>
            </div>

            {/* Counter Card */}
            <div className="bg-[#f8fafc] p-4 rounded-2xl border border-yellow-100">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-yellow-100 rounded-lg shrink-0">
                  <CreditCard className="w-5 h-5 stroke-yellow-600" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-gray-800 mb-1 ">Counter Card</h5>
                  <p className="text-[10px] text-[#94A3B8] leading-tight mt-0.5">A pre-printed tent card for your counter</p>
                </div>
              </div>
              <button className="w-full flex items-center justify-center gap-2 p-3 bg-[#f4c24d] rounded-lg text-xs font-semibold text-black hover:bg-[#e5b54d] transition-colors shadow-sm">
                Order Free Now <span className="text-lg leading-none"><ArrowRight className='size-4' /></span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
