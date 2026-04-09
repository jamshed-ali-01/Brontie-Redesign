'use client';

import { useEffect } from 'react';
import { PostHogProvider } from 'posthog-js/react';
import posthog from 'posthog-js';

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (posthog.__loaded) return; // already initialised

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: '/ingest',
      ui_host: 'https://eu.posthog.com',
      defaults: '2025-05-24',
      capture_exceptions: true,
      debug: process.env.NODE_ENV === 'development',
    });
  }, []);

  return (
    <PostHogProvider client={posthog}>
      {children}
    </PostHogProvider>
  );
}
