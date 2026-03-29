import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Merchant from '@/models/Merchant';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');

    if (!merchantId) {
      return NextResponse.json(
        { error: 'Missing merchantId' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Get merchant details
    const merchant = await Merchant.findById(merchantId);
    if (!merchant || !merchant.stripeConnectSettings?.accountId) {
      return NextResponse.json(
        { error: 'Merchant or Stripe Connect account not found' },
        { status: 404 }
      );
    }

    // Get account details from Stripe
    const account = await stripe.accounts.retrieve(merchant.stripeConnectSettings.accountId);

    // Update merchant with current status
    await Merchant.findByIdAndUpdate(merchantId, {
      'stripeConnectSettings.onboardingCompleted': account.details_submitted,
      'stripeConnectSettings.chargesEnabled': account.charges_enabled,
      'stripeConnectSettings.payoutsEnabled': account.payouts_enabled,
      'stripeConnectSettings.detailsSubmitted': account.details_submitted,
    });

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        requirements: account.requirements,
        businessProfile: account.business_profile,
        payoutSchedule: account.settings?.payouts?.schedule,
      },
    });

  } catch (error) {
    console.error('Error fetching account status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account status' },
      { status: 500 }
    );
  }
}
