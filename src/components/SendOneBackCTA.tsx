'use client';
import { useState, useEffect } from 'react';

// GA4 helper function
const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).dataLayer) {
    (window as any).dataLayer.push({
      event: eventName,
      ...params,
    });
  }
};

export default function SendOneBackCTA() {
  const [hasRecipientToken, setHasRecipientToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getRecipientToken = (): string | null => {
      const cookieToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('brontie_recipient_id='))
        ?.split('=')[1];
      
      if (cookieToken) return cookieToken;
      
      return localStorage.getItem('brontie_recipient_id');
    };

    const token = getRecipientToken();
    setHasRecipientToken(!!token);

    // 🔥 Track that the Send One Back CTA was shown
    if (token) {
      trackEvent('viral_cta_shown', {
        recipient_token: token,
      });
    }
  }, []);

  const handleSendOneBack = async () => {
    if (!hasRecipientToken) return;
    
    setIsLoading(true);
    
    try {
      const getRecipientToken = (): string | null => {
        const cookieToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('brontie_recipient_id='))
          ?.split('=')[1];
        
        if (cookieToken) return cookieToken;
        
        return localStorage.getItem('brontie_recipient_id');
      };

      const token = getRecipientToken();
      
      if (token) {
        // 🔥 Track PostHog event (already existing)
        if (typeof window !== 'undefined' && (window as any).posthog) {
          ((window as any).posthog as { capture: (event: string, properties?: Record<string, unknown>) => void }).capture('recip_intent_send', { 
            recipient_token: token 
          });
        }

        // 🔥 Track GA4 viral loop clicked event
        trackEvent('viral_loop_triggered', {
          recipient_token: token,
          action: 'send_one_back_clicked',
        });
        
        window.location.href = `/?ref=${token}`;
      }
    } catch (error) {
      console.error('Error handling send one back:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasRecipientToken) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={handleSendOneBack}
        disabled={isLoading}
        className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-3 rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Sending...</span>
          </>
        ) : (
          <>
            <span>💛</span>
            <span>Send One Back</span>
          </>
        )}
      </button>
    </div>
  );
}
