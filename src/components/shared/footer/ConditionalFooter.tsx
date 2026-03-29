'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

const ConditionalFooter = () => {
  const pathname = usePathname();

  const shouldShow =
    pathname === '/' ||
    pathname === '/about' ||
    pathname === '/contact' ||
    pathname === '/products' ||
    pathname === '/benefits' ||
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
  return <Footer />;
};

export default ConditionalFooter;
