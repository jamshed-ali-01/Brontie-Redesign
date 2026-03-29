'use client';

import { useEffect } from 'react';

export default function ViralLoopTracker() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    // Check for both 'rt' (recipient token) and 'ref' (referral token) parameters
    const recipientToken = urlParams.get('rt') || urlParams.get('ref');
    
    if (recipientToken) {
      // Armazena token no localStorage e cookie
      localStorage.setItem('brontie_recipient_id', recipientToken);
      document.cookie = `brontie_recipient_id=${recipientToken}; max-age=31536000; path=/`;
      
      // Tracking com PostHog (se disponível)
      if (typeof window !== 'undefined' && (window as any).posthog) {
        ((window as any).posthog as { capture: (event: string, properties?: Record<string, unknown>) => void }).capture('gift_opened', { 
          recipient_token: recipientToken 
        });
      }
      
      console.log('Viral loop token tracked:', recipientToken);
    }
  }, []);

  return null;
}
