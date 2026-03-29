'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';

export default function ProductsCityTracker() {
  const searchParams = useSearchParams();
  const posthog = usePostHog();
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) return;
    const city = searchParams.get('city');
    if (!city || city.toLowerCase() !== 'leixlip') return;
    trackedRef.current = true;
    try {
      if (posthog) {
        posthog.capture('qr_code_scanned', {
          short_id: 'products-city-leixlip',
          merchant_id: '68483ef21d38b4b7195d45d0',
          merchant_name: 'Willow & Wild',
          location_id: '684946146cbbf9734d59d75f',
          location_name: 'Willow & Wild - Leixlip',
          is_from_redeem_page: false,
          referrer: document.referrer || undefined,
          page: 'products',
          path: window.location.pathname + window.location.search,
        });
      }
    } catch {}
  }, [searchParams, posthog]);

  return null;
}


