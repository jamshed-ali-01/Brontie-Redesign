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

    if (!merchant.stripeConnectSettings.isConnected) {
      return NextResponse.json(
        { error: 'Stripe Connect account not fully connected' },
        { status: 400 }
      );
    }

    // Get request body
    const { amount, description } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Create transfer to connected account
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'eur',
      destination: merchant.stripeConnectSettings.accountId,
      description: description || `Payout to ${merchant.name}`,
    });

    console.log('Transfer created:', {
      merchantId,
      accountId: merchant.stripeConnectSettings.accountId,
      amount: amount,
      transferId: transfer.id
    });

    return NextResponse.json({
      success: true,
      transferId: transfer.id,
      amount: amount,
      message: 'Transfer initiated successfully'
    });

  } catch (error) {
    console.error('Error creating transfer:', error);
    return NextResponse.json(
      { error: 'Failed to create transfer', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

