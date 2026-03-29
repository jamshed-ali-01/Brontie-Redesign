import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Voucher from '@/models/Voucher';
import PayoutItem from '@/models/PayoutItem';
import { stripe } from '@/lib/stripe';
import { getStripeFee } from '@/lib/stripe-fees';

export async function POST(request: NextRequest) {
  try {
    const { voucherId } = await request.json();

    if (!voucherId) {
      return NextResponse.json(
        { error: 'Missing voucherId' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Get voucher details
    const voucher = await Voucher.findById(voucherId).populate({
      path: 'giftItemId',
      populate: {
        path: 'merchantId',
      },
    });

    if (!voucher) {
      return NextResponse.json(
        { error: 'Voucher not found' },
        { status: 404 }
      );
    }

    const merchant = (voucher.giftItemId as Record<string, unknown>).merchantId as any;

    if (!(merchant as any)?.stripeConnectSettings?.accountId) {
      return NextResponse.json(
        { error: 'Merchant does not have Stripe Connect account' },
        { status: 400 }
      );
    }

    // Calculate payout amounts
    const grossAmount = voucher.amountGross || voucher.amount || 0;
    
    // Use stored Stripe fee if available, otherwise get it from Stripe
    let stripeFee = voucher.stripeFee || 0;
    if (!stripeFee && voucher.paymentIntentId) {
      stripeFee = await getStripeFee(voucher.paymentIntentId, grossAmount);
    }
    
    const netAfterStripe = grossAmount - stripeFee;
    
    // Check if merchant should pay Brontie commission (90 days after creation)
    const daysSinceCreation = Math.floor(
      (new Date().getTime() - new Date(merchant.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const shouldApplyCommission = daysSinceCreation >= 90;
    const brontieFee = shouldApplyCommission ? netAfterStripe * 0.10 : 0; // 10% after 90 days
    const amountPayable = netAfterStripe - brontieFee;

    // Create payout item record
    const payoutItem = new PayoutItem({
      voucherId: voucher._id,
      merchantId: merchant._id,
      amountPayable,
      brontieFee,
      stripeFee,
      status: 'pending',
    });

    await payoutItem.save();

    // Create transfer via Stripe Connect
    const transfer = await stripe.transfers.create({
      amount: Math.round(amountPayable * 100), // Convert to cents
      currency: 'eur',
      destination: merchant.stripeConnectSettings.accountId,
      transfer_group: `voucher_${voucherId}`,
    });

    // Update payout item with transfer ID
    payoutItem.transferId = transfer.id;
    payoutItem.status = 'paid';
    payoutItem.paidOutAt = new Date();
    await payoutItem.save();

    // Update voucher status to redeemed if not already
    if (voucher.status !== 'redeemed') {
      voucher.status = 'redeemed';
      voucher.redeemedAt = new Date();
      await voucher.save();
    }

    return NextResponse.json({
      success: true,
      transfer: {
        id: transfer.id,
        amount: amountPayable,
        currency: 'eur',
        destination: merchant.stripeConnectSettings.accountId,
      },
      payoutItem: {
        id: payoutItem._id,
        amountPayable,
        brontieFee,
        stripeFee,
        status: payoutItem.status,
      },
    });

  } catch (error) {
    console.error('Error creating transfer:', error);
    return NextResponse.json(
      { error: 'Failed to create transfer' },
      { status: 500 }
    );
  }
}
