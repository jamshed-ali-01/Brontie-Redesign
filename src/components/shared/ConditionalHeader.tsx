'use client';
import Header from './header/Header';
import { usePathname } from 'next/navigation';

export default function ConditionalHeader() {
  const pathname = usePathname();

  const shouldShow =
    pathname === '/' ||
    pathname === '/about' ||
    pathname === '/contact' ||
    pathname === '/benefits' ||
    pathname === '/products' ||
    pathname === '/featured' ||
    pathname === '/how-it-works' ||
    pathname === '/cookie-policy' ||
    pathname === '/term-condition' ||
    pathname === '/where_to_use_brontie' ||
    pathname === '/privacy-policy' ||
    pathname === '/bulk-gifting' ||
    pathname === '/checkout/success' ||
    pathname.startsWith('/product');

  if (!shouldShow) return null;
  return <Header />;
}
