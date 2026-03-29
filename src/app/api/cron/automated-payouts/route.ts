import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Voucher from '@/models/Voucher';
import PayoutItem from '@/models/PayoutItem';
import { stripe } from '@/lib/stripe';
import { getStripeFee } from '@/lib/stripe-fees';
import { shouldRunBiweeklyCron, recordCronRun } from '@/lib/cron-helper';

export async function POST(request: NextRequest) {
  try {
    // Verify this is a cron job request (add authentication as needed)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    console.log('🚀 Starting biweekly automated payouts process...');

    // Check if we should run (biweekly logic - only every 14 days)
    const cronCheck = await shouldRunBiweeklyCron('process-payouts');

    if (!cronCheck.shouldRun) {
      console.log(`⏭️ Skipping biweekly payouts - only ${cronCheck.daysSinceLastRun} days since last run (need 14+)`);
      await recordCronRun('process-payouts', 'skipped', cronCheck.periodStart, cronCheck.periodEnd,
        `Skipped - only ${cronCheck.daysSinceLastRun} days since last run`);

      return NextResponse.json({
        success: true,
        message: 'Skipped - biweekly schedule not met',
        daysSinceLastRun: cronCheck.daysSinceLastRun,
        nextRunIn: 14 - (cronCheck.daysSinceLastRun || 0)
      });
    }

    console.log(`✅ Running biweekly payouts for period: ${cronCheck.periodStart.toLocaleDateString('en-GB')} to ${cronCheck.periodEnd.toLocaleDateString('en-GB')}`);

    // Find all redeemed vouchers that don't have payout items yet
    const redeemedVouchers = await Voucher.find({
      status: 'redeemed',
      _id: { $nin: await PayoutItem.distinct('voucherId') }
    }).populate({
      path: 'giftItemId',
      populate: {
        path: 'merchantId',
      },
    });

    console.log(`Found ${redeemedVouchers.length} redeemed vouchers without payouts`);

    // Create payout items for redeemed vouchers
    const payoutItems = [];
    for (const voucher of redeemedVouchers) {
      const merchant = (voucher.giftItemId as Record<string, unknown>).merchantId;
      
      if (!(merchant as any)?.stripeConnectSettings?.accountId) {
        console.log(`Skipping voucher ${voucher._id} - merchant has no Stripe Connect account`);
        continue;
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
        (new Date().getTime() - new Date((merchant as any).createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      const shouldApplyCommission = daysSinceCreation >= 90;
      const brontieFee = shouldApplyCommission ? netAfterStripe * 0.10 : 0; // 10% after 90 days
      const amountPayable = netAfterStripe - brontieFee;

      payoutItems.push({
        voucherId: voucher._id,
        merchantId: (merchant as any)._id,
        amountPayable,
        brontieFee,
        stripeFee,
        status: 'pending',
      });
    }

    // Insert all payout items
    if (payoutItems.length > 0) {
      await PayoutItem.insertMany(payoutItems);
      console.log(`Created ${payoutItems.length} payout items`);
    }

    // Group pending payouts by merchant
    const pendingPayouts = await PayoutItem.find({ status: 'pending' }).populate('merchantId');
    
    if (pendingPayouts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending payouts to process',
        processed: 0,
      });
    }

    // Group by merchant
    const groupedByMerchant = pendingPayouts.reduce((acc: any, payout: any) => {
      const merchantId = payout.merchantId._id.toString();
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
        const merchant = (payouts as any)[0].merchantId;
        
        if (!(merchant as any).stripeConnectSettings?.accountId) {
          results.errors.push({
            merchantId,
            merchantName: (merchant as any).name,
            error: 'Merchant does not have Stripe Connect account',
            payouts: (payouts as any).length,
          });
          results.failed += (payouts as any).length;
          continue;
        }

        // Check if account is ready for payouts
        if (!(merchant as any).stripeConnectSettings.payoutsEnabled) {
          results.errors.push({
            merchantId,
            merchantName: (merchant as any).name,
            error: 'Merchant Stripe Connect account not ready for payouts',
            payouts: (payouts as any).length,
          });
          results.failed += (payouts as any).length;
          continue;
        }

        // Calculate total amount for this merchant
        const totalAmount = (payouts as any).reduce((sum: any, payout: any) => sum + payout.amountPayable, 0);

        // Skip if amount is too small (minimum transfer amount)
        if (totalAmount < 0.50) {
          console.log(`Skipping merchant ${(merchant as any).name} - amount too small: €${totalAmount}`);
          continue;
        }

        // Create transfer via Stripe Connect
        const transfer = await stripe.transfers.create({
          amount: Math.round(totalAmount * 100), // Convert to cents
          currency: 'eur',
          destination: (merchant as any).stripeConnectSettings.accountId,
          transfer_group: `automated_${Date.now()}`,
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

        results.transfers.push({
          merchantId,
          merchantName: (merchant as any).name,
          transferId: transfer.id,
          amount: totalAmount,
          payoutCount: (payouts as any).length,
        });

        results.processed += (payouts as any).length;

        console.log(`Processed payouts for ${(merchant as any).name}: €${totalAmount} (${(payouts as any).length} vouchers)`);

      } catch (error) {
        console.error(`Error processing payouts for merchant ${merchantId}:`, error);
        results.errors.push({
          merchantId,
          merchantName: (payouts as any)[0].merchantId.name,
          error: error instanceof Error ? error.message : 'Unknown error',
          payouts: (payouts as any).length,
        });
        results.failed += (payouts as any).length;
      }
    }

    console.log('Biweekly automated payouts process completed:', results);

    // Record successful cron run
    await recordCronRun('process-payouts', 'success', cronCheck.periodStart, cronCheck.periodEnd,
      `Processed ${results.processed} payouts, ${results.failed} failed, ${results.transfers.length} transfers`);

    return NextResponse.json({
      success: true,
      message: 'Biweekly automated payouts process completed',
      period: {
        start: cronCheck.periodStart.toISOString(),
        end: cronCheck.periodEnd.toISOString(),
      },
      ...results,
    });

  } catch (error) {
    console.error('Error in biweekly automated payouts process:', error);

    // Record failed cron run
    try {
      await recordCronRun('process-payouts', 'failed', undefined, undefined,
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } catch (recordError) {
      console.error('Failed to record cron run:', recordError);
    }

    return NextResponse.json(
      {
        error: 'Failed to process biweekly automated payouts',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
