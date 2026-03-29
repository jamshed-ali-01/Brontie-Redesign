import type { Metadata } from 'next';
import './globals.css';
import { PHProvider } from './posthog-provider';
import Script from 'next/script';
import ConditionalHeader from '@/components/shared/ConditionalHeader';
import ConditionalFooter from '@/components/shared/footer/ConditionalFooter';
import ViralLoopTracker from '@/components/ViralLoopTracker';
import SendOneBackCTA from '@/components/SendOneBackCTA';
import { Toaster } from 'react-hot-toast';
// import MaintenanceBanner from '@/components/shared/MaintenanceBanner';

export const metadata: Metadata = {
  title: 'Brontie — Send a Coffee Gift Online | Ireland',
  description: 'Send a coffee gift to anyone in Ireland in seconds. Perfect for volunteers, teams, teachers and loved ones. Redeemed at local cafés. No app needed.',
  keywords: 'coffee gift ireland, send coffee online ireland, volunteer gift ireland, last minute gift ireland, digital gift ireland, coffee voucher ireland, gift a coffee ireland, thank you gift ireland, cheap gift ireland, same day gift ireland',
  verification: {
    google: 'Ghc_4R2gXMbz2gmoTG7o2D4Jr2t4ETeaf0Nh8_QaRns',
  },
  openGraph: {
    title: 'Brontie — Send a Coffee Gift Online | Ireland',
    description: 'Send a coffee gift to anyone in Ireland in seconds. Redeemed at local cafés. No app needed.',
    url: 'https://www.brontie.ie',
    siteName: 'Brontie',
    images: [
      {
        url: 'https://www.brontie.ie/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Brontie - Send a Coffee Gift Online Ireland',
      },
    ],
    locale: 'en_IE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brontie — Send a Coffee Gift Online | Ireland',
    description: 'Send a coffee gift to anyone in Ireland in seconds. Redeemed at local cafés. No app needed.',
    images: ['https://www.brontie.ie/images/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://www.brontie.ie',
  },
};

import { getMaintenanceStatus } from '@/lib/mongodb';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { maintenanceMode } = await getMaintenanceStatus();

  return (
    <html lang="en">
      <head>
        {/* Google Tag Manager */}
        <Script id="gtm-script" strategy="beforeInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-P7V3GLTJ');`}
        </Script>
      </head>
      <body
        className={`antialiased font-sans min-h-screen coffeE-gift-main-wrapper-area`}
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-P7V3GLTJ"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          ></iframe>
        </noscript>
        {/* <MaintenanceBanner maintenanceMode={maintenanceMode} /> */}
        <ConditionalHeader />
        <PHProvider>
          <ViralLoopTracker />
          <main className="page-main-content-wrapper">
            <Toaster
              position="bottom-right"
              toastOptions={{ duration: 3000 }}
            />
            {children}
          </main>
          {/* <SendOneBackCTA /> */}
        </PHProvider>
        <ConditionalFooter />
      </body>
    </html>
  );
}
