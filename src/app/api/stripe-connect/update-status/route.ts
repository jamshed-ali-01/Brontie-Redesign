import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Merchant from '@/models/Merchant';
import { stripe } from '@/lib/stripe';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    // Get merchant ID from JWT token
    const token = request.cookies.get('cafe-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { merchantId: string };
    const merchantId = decoded.merchantId;

    if (!merchantId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Get merchant details
    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    if (!merchant.stripeConnectSettings?.accountId) {
      return NextResponse.json(
        { error: 'Stripe Connect account not found' },
        { status: 404 }
      );
    }

    // Get updated account details from Stripe
    const account = await stripe.accounts.retrieve(merchant.stripeConnectSettings.accountId);

    // Update merchant with current status
    const updatedMerchant = await Merchant.findByIdAndUpdate(
      merchantId,
      {
        'stripeConnectSettings.isConnected': account.details_submitted && account.charges_enabled,
        'stripeConnectSettings.onboardingCompleted': account.details_submitted,
        'stripeConnectSettings.chargesEnabled': account.charges_enabled,
        'stripeConnectSettings.payoutsEnabled': account.payouts_enabled,
        'stripeConnectSettings.detailsSubmitted': account.details_submitted,
        'stripeConnectSettings.payoutSchedule': account.settings?.payouts?.schedule,
      },
      { new: true }
    );

    console.log('Stripe Connect status updated:', {
      merchantId,
      accountId: merchant.stripeConnectSettings.accountId,
      isConnected: account.details_submitted && account.charges_enabled,
      onboardingCompleted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      payoutSchedule: account.settings?.payouts?.schedule
    });

    return NextResponse.json({
      success: true,
      stripeConnectSettings: updatedMerchant?.stripeConnectSettings,
      message: 'Stripe Connect status updated successfully'
    });

  } catch (error) {
    console.error('Error updating Stripe Connect status:', error);
    return NextResponse.json(
      { error: 'Failed to update Stripe Connect status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

