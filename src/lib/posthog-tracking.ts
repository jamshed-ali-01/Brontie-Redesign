// PostHog tracking utilities
export interface PostHogEvent {
  event: string;
  properties?: Record<string, unknown>;
}

type QueuedEvent = { event: string; properties?: Record<string, unknown> };
const pendingEvents: QueuedEvent[] = [];

export const flushPosthogQueue = () => {
  if (typeof window === 'undefined') return;
  const ph = (window as any).posthog;
  if (!ph) return;
  try {
    while (pendingEvents.length > 0) {
      const item = pendingEvents.shift()!;
      ph.capture(item.event, item.properties);
    }
    if (ph.flush) ph.flush();
  } catch (e) {
    console.error('PostHog queue flush error:', e);
  }
};

const tryCapture = (event: string, properties?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && (window as any).posthog) {
    try {
      const ph = (window as any).posthog;
      ph.capture(event, properties);
      if (ph.flush) ph.flush();
      return;
    } catch (e) {
      console.error('PostHog capture error:', e);
    }
  }
  // Queue if not available yet (e.g., blocked by CMP until consent)
  pendingEvents.push({ event, properties });
  // Try a delayed flush soon after (in case CMP just enabled)
  if (typeof window !== 'undefined') {
    setTimeout(flushPosthogQueue, 500);
  }
};

export const trackEvent = (event: string, properties?: Record<string, unknown>) => {
  tryCapture(event, properties);
};

export const flushAndWait = async (timeoutMs = 250): Promise<void> => {
  if (typeof window === 'undefined') return;
  const ph = (window as any).posthog;
  if (!ph || !ph.flush) {
    await new Promise(resolve => setTimeout(resolve, Math.min(200, timeoutMs)));
    return;
  }
  await new Promise<void>((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve();
    }, timeoutMs);
    try {
      ph.flush(() => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve();
      });
    } catch {
      clearTimeout(timer);
      resolve();
    }
  });
};

// Specific tracking functions for QR code flow
export const trackQRCodeScanned = (data: {
  short_id: string;
  merchant_id: string;
  merchant_name: string;
  location_id: string;
  location_name: string;
  is_from_redeem_page: boolean;
  referrer: string;
  qr_type?: string;
  target_url?: string;
}) => {
  trackEvent('qr_code_scanned', data);
};

export const trackQRNavigationToProducts = (data: {
  merchant_id: string;
  merchant_name: string;
  location_id: string | null;
  source: string;
}) => {
  trackEvent('qr_navigation_to_products', data);
};

export const trackGiftPurchaseIntent = (data: {
  gift_item_id: string;
  gift_name: string;
  gift_price: number;
  merchant_id: string;
  merchant_name: string;
  location_ids: string[];
  location_names: string[];
  active_tab: string;
  selected_county: string;
}) => {
  trackEvent('gift_purchase_intent', data);
};

export const trackMerchantTabChanged = (data: {
  tab_name: string;
  selected_county: string;
  total_gifts: number;
}) => {
  trackEvent('merchant_tab_changed', data);
};

export const trackCountyFilterChanged = (data: {
  selected_county: string;
  active_tab: string;
  total_gifts: number;
}) => {
  trackEvent('county_filter_changed', data);
};

export const trackShowAllToggled = (data: {
  show_all: boolean;
  active_tab: string;
  selected_county: string;
  total_gifts: number;
}) => {
  trackEvent('show_all_toggled', data);
};
