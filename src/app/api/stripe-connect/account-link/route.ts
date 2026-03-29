import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'Missing accountId' },
        { status: 400 }
      );
    }


    // Create account link for dashboard access
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cafes/dashboard`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cafes/dashboard`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      success: true,
      url: accountLink.url,
    });

  } catch (error) {
    console.error('Error creating account link:', error);
    return NextResponse.json(
      { error: 'Failed to create account link' },
      { status: 500 }
    );
  }
}
