'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function CafeAnalyticsLayout({ children }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const ensureAuth = async () => {
      try {
        const res = await fetch('/api/cafes/profile');
        if (!res.ok) {
          router.push('/cafes/login');
        }
      } catch {
        router.push('/cafes/login');
      }
    };
    ensureAuth();
  }, [router]);

  const nav = [
    { name: 'Voucher Funnel', href: '/cafes/analytics/funnel', icon: '📊' },
    { name: 'Payouts', href: '/cafes/analytics/payouts', icon: '💰' },
    { name: 'Fees Breakdown', href: '/cafes/analytics/fees', icon: '💸' },
    { name: 'Product Mix & AOV', href: '/cafes/analytics/product-mix', icon: '📦' },
  ];

  return (
    <div className="p-6">
      <div className="mb-4">
        <Link
          href="/cafes/dashboard"
          className="inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors text-sm"
        >
          ← Back to Dashboard
        </Link>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📈 Your Café Analytics</h1>
        <p className="text-gray-600">Insights scoped to your café only.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {nav.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block border rounded-xl p-4 transition-colors ${
                isActive ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-teal-300'
              }`}
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="font-semibold text-gray-900">{item.name}</div>
              <div className="text-sm text-gray-600">View</div>
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}


