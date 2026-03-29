import { NextRequest, NextResponse } from 'next/server';
import { getQRCodeAnalytics, getFunnelAnalytics, fetchPostHogEvents } from '@/lib/posthog-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchant = searchParams.get('merchant') || undefined;
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const startDate = from ? new Date(from) : undefined;
    const endDate = to ? new Date(to) : undefined;

    const qrAnalytics = await getQRCodeAnalytics(merchant, startDate, endDate);
    const funnelAnalytics = await getFunnelAnalytics(merchant, startDate, endDate);
    try {
      console.log('[PostHog API] analytics summary', {
        merchant,
        qrTotals: qrAnalytics?.totalScans,
        funnel: funnelAnalytics
      });
    } catch {}

    // Optionally return recent raw events for debugging/visibility in UI
    const recentScans = await fetchPostHogEvents('qr_code_scanned', startDate, endDate, {
      ...(merchant ? { merchant_id: merchant } : {}),
    });
    try {
      console.log('[PostHog API] recent scans sample', {
        count: recentScans.length,
        first: recentScans[0]
      });
    } catch {}

    return NextResponse.json({
      success: true,
      data: {
        qrAnalytics,
        funnelAnalytics,
        recentScans,
      },
    });
  } catch (error) {
    console.error('PostHog admin API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch PostHog data' }, { status: 500 });
  }
}


