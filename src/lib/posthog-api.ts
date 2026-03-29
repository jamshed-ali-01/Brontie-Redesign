// PostHog API integration for server-side data fetching
import { PostHog } from 'posthog-node';

// Initialize PostHog server-side client
const posthog = new PostHog(
  process.env.POSTHOG_API_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY!,
  {
    host: 'https://eu.i.posthog.com',
    flushAt: 1,
    flushInterval: 0,
  }
);

export interface PostHogEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: string;
  distinct_id?: string;
}
function safeParse(json: unknown): Record<string, any> | {} {
  if (typeof json !== 'string') return (json as Record<string, any>) || {};
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export interface PostHogInsight {
  id: number;
  name: string;
  description?: string;
  query: any;
  filters?: any;
  result?: any[];
}

// Fetch events from PostHog via HogQL (more reliable for server-side queries)
export async function fetchPostHogEvents(
  eventName: string,
  startDate?: Date,
  endDate?: Date,
  properties?: Record<string, any>
): Promise<PostHogEvent[]> {
  try {
    // Require server-side API key for read access
    const apiKey = process.env.POSTHOG_API_KEY;
    if (!apiKey) {
      console.warn('POSTHOG_API_KEY not configured');
      return [];
    }

    const projectId = await getPostHogProjectId();
    if (!projectId) {
      console.warn('PostHog project ID not found');
      return [];
    }

    const whereClauses: string[] = [
      `event = '${eventName.replace(/'/g, "''")}'`
    ];
    if (startDate) whereClauses.push(`timestamp >= toDateTime('${startDate.toISOString()}')`);
    if (endDate) whereClauses.push(`timestamp <= toDateTime('${endDate.toISOString()}')`);
    if (properties) {
      for (const [key, value] of Object.entries(properties)) {
        const safeKey = key.replace(/"/g, '\\"');
        const safeVal = String(value).replace(/'/g, "''");
        whereClauses.push(`properties["${safeKey}"] = '${safeVal}'`);
      }
    }

    const hogql = `
      SELECT
        event,
        distinct_id,
        timestamp,
        properties
      FROM events
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY timestamp DESC
      LIMIT 500
    `;

    const response = await fetch(`https://eu.i.posthog.com/api/projects/${projectId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: {
          kind: 'HogQLQuery',
          query: hogql
        }
      })
    });

    if (!response.ok) {
      throw new Error(`PostHog API error: ${response.status}`);
    }

    const data = await response.json();
    // data.results is typically an array of rows; normalize to PostHogEvent
    const rows: any[] = data.results || [];
    try {
      console.log('[PostHog] HogQL results', {
        rowsCount: rows.length,
        sample: rows[0]
      });
    } catch {}
    const normalized = rows.map((r: any) => ({
      event: r[0] ?? r.event,
      distinct_id: r[1] ?? r.distinct_id,
      timestamp: r[2] ?? r.timestamp,
      properties: r[3] ?? r.properties,
    }));
    // Parse properties if they came as serialized JSON strings
    for (const ev of normalized) {
      if (typeof ev.properties === 'string') {
        try {
          ev.properties = JSON.parse(ev.properties as unknown as string);
        } catch {}
      }
    }
    return normalized as PostHogEvent[];
  } catch (error) {
    console.error('Error fetching PostHog events (HogQL):', error);
    return [];
  }
}

// Fetch insights from PostHog
export async function fetchPostHogInsights(): Promise<PostHogInsight[]> {
  try {
    if (!process.env.POSTHOG_API_KEY && !process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      console.warn('PostHog API key not configured');
      return [];
    }

    // Get project ID first
    const projectId = await getPostHogProjectId();
    if (!projectId) {
      console.warn('PostHog project ID not found');
      return [];
    }

    // Fetch insights from PostHog API
    const response = await fetch(`https://eu.i.posthog.com/api/projects/${projectId}/insights`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.POSTHOG_API_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`PostHog API error: ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching PostHog insights:', error);
    return [];
  }
}

// Get QR code scan analytics
export async function getQRCodeAnalytics(
  merchantId?: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const events = await fetchPostHogEvents('qr_code_scanned', startDate, endDate, {
      ...(merchantId && { merchant_id: merchantId }),
    });
    try {
      console.log('[PostHog] qr_code_scanned fetched', {
        count: events.length,
        sampleProperties: events[0]?.properties
      });
    } catch {}

    if (events.length === 0) {
      return {
        totalScans: 0,
        uniqueUsers: 0,
        scansByMerchant: {},
        scansByType: {},
      };
    }

    // Process events to get analytics
    const analytics = {
      totalScans: events.length,
      uniqueUsers: new Set(events.map(e => e.distinct_id)).size,
      scansByMerchant: {} as Record<string, number>,
      scansByType: {} as Record<string, number>,
    };

    events.forEach(event => {
      const props = typeof event.properties === 'string' ? safeParse(event.properties) : event.properties || {};
      const merchant = (props as any).merchant_name || 'Unknown';
      const qrType = (props as any).qr_type || 'merchant';
      
      analytics.scansByMerchant[merchant] = (analytics.scansByMerchant[merchant] || 0) + 1;
      analytics.scansByType[qrType] = (analytics.scansByType[qrType] || 0) + 1;
    });

    return analytics;
  } catch (error) {
    console.error('Error getting QR code analytics:', error);
    return {
      totalScans: 0,
      uniqueUsers: 0,
      scansByMerchant: {},
      scansByType: {},
    };
  }
}

// Get PostHog project ID (needed for API calls)
export async function getPostHogProjectId(): Promise<string | null> {
  try {
    if (!process.env.POSTHOG_API_KEY && !process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      return null;
    }

    const response = await fetch('https://eu.i.posthog.com/api/projects/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.POSTHOG_API_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`PostHog API error: ${response.status}`);
    }

    const data = await response.json();
    return data.results?.[0]?.id || null;
  } catch (error) {
    console.error('Error getting PostHog project ID:', error);
    return null;
  }
}

// Get funnel analytics
export async function getFunnelAnalytics(
  merchantId?: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const qrScanEvents = await fetchPostHogEvents('qr_code_scanned', startDate, endDate, {
      ...(merchantId && { merchant_id: merchantId }),
    });

    const productViewEvents = await fetchPostHogEvents('qr_navigation_to_products', startDate, endDate, {
      ...(merchantId && { merchant_id: merchantId }),
    });

    const purchaseIntentEvents = await fetchPostHogEvents('gift_purchase_intent', startDate, endDate, {
      ...(merchantId && { merchant_id: merchantId }),
    });

    const tabChangeEvents = await fetchPostHogEvents('merchant_tab_changed', startDate, endDate, {
      ...(merchantId && { merchant_id: merchantId }),
    });

    // Calculate funnel steps based on real events
    const funnel = {
      qrScans: qrScanEvents.length,
      productViews: productViewEvents.length,
      addToCart: tabChangeEvents.length, // Tab changes indicate product interest
      checkout: purchaseIntentEvents.length,
      purchases: 0, // This would come from completed transactions in the database
    };

    return funnel;
  } catch (error) {
    console.error('Error getting funnel analytics:', error);
    return {
      qrScans: 0,
      productViews: 0,
      addToCart: 0,
      checkout: 0,
      purchases: 0,
    };
  }
}

// Close PostHog connection
export function closePostHog() {
  posthog.shutdown();
}
