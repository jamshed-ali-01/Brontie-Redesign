'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AnalyticsLayoutProps {
  children: React.ReactNode;
}

export default function AnalyticsLayout({ children }: AnalyticsLayoutProps) {
  const pathname = usePathname();

  const analyticsNavigation = [
    { 
      name: 'Voucher Funnel', 
      href: '/admin/analytics/funnel', 
      description: 'Sold vs Redeemed vs Refunded',
      icon: '📊'
    },
    { 
      name: 'Payouts', 
      href: '/admin/analytics/payouts', 
      description: 'Net Payable: Available vs Paid',
      icon: '💰'
    },
    { 
      name: 'Fees Breakdown', 
      href: '/admin/analytics/fees', 
      description: 'Stripe, Brontie, Net to Café',
      icon: '💸'
    },
    { 
      name: 'Redemption Delay', 
      href: '/admin/analytics/redemption-delay', 
      description: 'Time from Issue to Redemption',
      icon: '⏱️'
    },
    { 
      name: 'Product Mix & AOV', 
      href: '/admin/analytics/product-mix', 
      description: 'Product Share & Average Order Value',
      icon: '📦'
    },
    { 
      name: 'Customer Acquisition', 
      href: '/admin/analytics/customer-acquisition', 
      description: 'Viral Loop Analysis',
      icon: '🚀'
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          📊 Analytics Dashboards
        </h1>
        <p className="text-gray-600">
          Comprehensive analytics for voucher lifecycle, payouts, fees, and viral growth.
        </p>
      </div>

      <div className="mb-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {analyticsNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`
                ${pathname === item.href
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
              `}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      {children}
    </div>
  );
}
