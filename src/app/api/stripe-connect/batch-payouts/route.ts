import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Merchant from '@/models/Merchant';
import Voucher from '@/models/Voucher';
import PayoutItem from '@/models/PayoutItem';
import { stripe } from '@/lib/stripe';

export async function POST() {
  try {
    await connectToDatabase();

    // Get all pending payout items
    const pendingPayouts = await PayoutItem.find({ status: 'pending' }).populate('voucherId merchantId');
    
    if (pendingPayouts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending payouts found',
        processed: 0,
      });
    }

    // Group by merchant
    const groupedByMerchant = pendingPayouts.reduce((acc: any, payout: any) => {
      const merchantId = payout.merchantId.toString();
      if (!acc[merchantId]) {
        acc[merchantId] = [];
      }
      acc[merchantId].push(payout);
      return acc;
    }, {} as Record<string, Record<string, unknown>[]>);

    const results = {
      processed: 0,
      failed: 0,
      transfers: [] as Record<string, unknown>[],
      errors: [] as Record<string, unknown>[],
    };

    // Process each merchant's payouts
    for (const [merchantId, payouts] of Object.entries(groupedByMerchant)) {
      try {
        const merchant = await Merchant.findById(merchantId);
        
        if (!merchant?.stripeConnectSettings?.accountId) {
          results.errors.push({
            merchantId,
            error: 'Merchant does not have Stripe Connect account',
            payouts: (payouts as any).length,
          });
          results.failed += (payouts as any).length;
          continue;
        }

        // Calculate total amount for this merchant
        const totalAmount = (payouts as any).reduce((sum: any, payout: any) => sum + payout.amountPayable, 0);

        // Create transfer via Stripe Connect
        const transfer = await stripe.transfers.create({
          amount: Math.round(totalAmount * 100), // Convert to cents
          currency: 'eur',
          destination: merchant.stripeConnectSettings.accountId,
          transfer_group: `batch_${Date.now()}`,
        });

        // Update all payout items for this merchant
        const payoutIds = (payouts as any).map((p: any) => p._id);
        await PayoutItem.updateMany(
          { _id: { $in: payoutIds } },
          {
            status: 'paid',
            paidOutAt: new Date(),
            transferId: transfer.id,
          }
        );

        // Update voucher statuses to redeemed
        const voucherIds = (payouts as any).map((p: any) => p.voucherId);
        await Voucher.updateMany(
          { _id: { $in: voucherIds } },
          {
            status: 'redeemed',
            redeemedAt: new Date(),
          }
        );

        results.transfers.push({
          merchantId,
          merchantName: merchant.name,
          transferId: transfer.id,
          amount: totalAmount,
          payoutCount: (payouts as any).length,
        });

        results.processed += (payouts as any).length;

      } catch (error) {
        console.error(`Error processing payouts for merchant ${merchantId}:`, error);
        results.errors.push({
          merchantId,
          error: error instanceof Error ? error.message : 'Unknown error',
          payouts: (payouts as any).length,
        });
        results.failed += (payouts as any).length;
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
    });

  } catch (error) {
    console.error('Error processing batch payouts:', error);
    return NextResponse.json(
      { error: 'Failed to process batch payouts' },
      { status: 500 }
    );
  }
}
