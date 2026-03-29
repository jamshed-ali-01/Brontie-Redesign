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

    const body = await request.json();
    const { returnUrl, refreshUrl } = body;

    // Get merchant details
    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Check if already has a Stripe account
    if (merchant.stripeConnectSettings?.accountId) {
      // Retrieve existing account
      const account = await stripe.accounts.retrieve(merchant.stripeConnectSettings.accountId);
      
      // If onboarding is complete, return success
      if (account.details_submitted && account.charges_enabled) {
        return NextResponse.json({
          success: true,
          accountId: account.id,
          alreadyConnected: true
        });
      }
      
      // If onboarding not complete, generate new onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: refreshUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/cafes/dashboard?stripe_refresh=true`,
        return_url: returnUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/cafes/dashboard?stripe_success=true`,
        type: 'account_onboarding',
      });

      return NextResponse.json({
        success: true,
        url: accountLink.url,
        accountId: account.id
      });
    }

    // Create new Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'IE', // Ireland
      email: merchant.contactEmail,
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
      business_type: 'company',
      business_profile: {
        name: merchant.name,
        url: merchant.website || undefined,
      },
      settings: {
        payouts: {
          schedule: {
            interval: 'manual', // Manual payouts - controlled by our biweekly cron job
          },
        },
      },
    });

    console.log('Stripe Connect account created:', {
      merchantId,
      accountId: account.id,
      merchantName: merchant.name
    });

    // Generate onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: refreshUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/cafes/dashboard?stripe_refresh=true`,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/cafes/dashboard?stripe_success=true`,
      type: 'account_onboarding',
    });

    // Save account ID to merchant
    merchant.stripeConnectSettings = {
      accountId: account.id,
      isConnected: false,
      onboardingCompleted: false,
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
    };
    
    await merchant.save();

    console.log('Stripe Connect onboarding link generated:', {
      merchantId,
      accountId: account.id,
      url: accountLink.url
    });

    return NextResponse.json({
      success: true,
      url: accountLink.url,
      accountId: account.id
    });

  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    return NextResponse.json(
      { error: 'Failed to create Stripe Connect account', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}