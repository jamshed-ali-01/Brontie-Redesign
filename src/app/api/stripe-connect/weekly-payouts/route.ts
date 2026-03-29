import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Merchant from '@/models/Merchant';
import Transaction from '@/models/Transaction';
import { stripe } from '@/lib/stripe';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    // Verify authorization (you should add proper authentication here)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'change-this-in-production';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Get all merchants with Stripe Connect enabled
    const merchants = await Merchant.find({
      'stripeConnectSettings.isConnected': true,
      'stripeConnectSettings.payoutsEnabled': true,
    });

    console.log(`Found ${merchants.length} merchants with Stripe Connect enabled`);

    const results = [];

    for (const merchant of merchants) {
      try {
        const merchantObjectId = merchant._id as mongoose.Types.ObjectId;
        
        // Find all redeemed vouchers that haven't been paid out yet
        const unpaidTransactions = await Transaction.aggregate([
          {
            $match: {
              merchantId: merchantObjectId,
              type: 'purchase',
              status: 'completed',
              stripePaidOut: { $ne: true }
            }
          },
          {
            $lookup: {
              from: 'vouchers',
              localField: 'voucherId',
              foreignField: '_id',
              as: 'voucher'
            }
          },
          {
            $unwind: '$voucher'
          },
          {
            $match: {
              'voucher.status': 'redeemed'
            }
          }
        ]);

        if (unpaidTransactions.length === 0) {
          console.log(`No unpaid transactions for merchant: ${merchant.name}`);
          results.push({
            merchantId: merchant._id,
            merchantName: merchant.name,
            status: 'no_transactions',
            amount: 0
          });
          continue;
        }

        // Calculate total payout amount
        let totalGrossAmount = 0;
        let totalStripeFees = 0;
        let totalBrontieFees = 0;

        for (const txn of unpaidTransactions) {
          totalGrossAmount += txn.amount || 0;
          
          // Calculate Stripe fee
          const stripeFee = txn.stripeFee || (txn.amount * 0.014 + 0.25);
          totalStripeFees += stripeFee;
          
          // Calculate Brontie commission (if active)
          const isBrontieFeeActive = !!(merchant.brontieFeeSettings?.isActive);
          const commissionRate = isBrontieFeeActive 
            ? (merchant.brontieFeeSettings?.commissionRate || 0.10) 
            : 0;
          
          const netAfterStripe = txn.amount - stripeFee;
          const brontieFee = netAfterStripe * commissionRate;
          totalBrontieFees += brontieFee;
        }

        // Calculate net payout to merchant
        const netPayout = totalGrossAmount - totalStripeFees - totalBrontieFees;

        // Minimum payout threshold (€5)
        if (netPayout < 5) {
          console.log(`Payout amount too low for merchant ${merchant.name}: €${netPayout.toFixed(2)}`);
          results.push({
            merchantId: merchant._id,
            merchantName: merchant.name,
            status: 'below_minimum',
            amount: netPayout
          });
          continue;
        }

        // Create Stripe transfer
        const transfer = await stripe.transfers.create({
          amount: Math.round(netPayout * 100), // Convert to cents
          currency: 'eur',
          destination: merchant.stripeConnectSettings!.accountId!,
          description: `Weekly payout for ${merchant.name} - ${unpaidTransactions.length} vouchers`,
          metadata: {
            merchantId: merchant._id.toString(),
            merchantName: merchant.name,
            transactionCount: unpaidTransactions.length.toString(),
            grossAmount: totalGrossAmount.toFixed(2),
            stripeFees: totalStripeFees.toFixed(2),
            brontieFees: totalBrontieFees.toFixed(2),
            netPayout: netPayout.toFixed(2)
          }
        });

        console.log(`✅ Transfer created for ${merchant.name}: €${netPayout.toFixed(2)}`, {
          transferId: transfer.id,
          transactionCount: unpaidTransactions.length
        });

        // Mark transactions as paid out
        await Transaction.updateMany(
          {
            _id: { $in: unpaidTransactions.map(t => t._id) }
          },
          {
            $set: {
              stripePaidOut: true,
              stripePaidOutAt: new Date(),
              stripeTransferId: transfer.id
            }
          }
        );

        results.push({
          merchantId: merchant._id,
          merchantName: merchant.name,
          status: 'success',
          amount: netPayout,
          transferId: transfer.id,
          transactionCount: unpaidTransactions.length,
          details: {
            grossAmount: totalGrossAmount,
            stripeFees: totalStripeFees,
            brontieFees: totalBrontieFees,
            netPayout: netPayout
          }
        });

      } catch (merchantError) {
        console.error(`Error processing payout for merchant ${merchant.name}:`, merchantError);
        results.push({
          merchantId: merchant._id,
          merchantName: merchant.name,
          status: 'error',
          error: merchantError instanceof Error ? merchantError.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      processedMerchants: merchants.length,
      results: results,
      summary: {
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'error').length,
        belowMinimum: results.filter(r => r.status === 'below_minimum').length,
        noTransactions: results.filter(r => r.status === 'no_transactions').length,
        totalPaidOut: results
          .filter(r => r.status === 'success')
          .reduce((sum, r) => sum + (r.amount || 0), 0)
      }
    });

  } catch (error) {
    console.error('Error processing weekly payouts:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process weekly payouts', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check status (for manual testing)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const merchants = await Merchant.find({
      'stripeConnectSettings.isConnected': true,
      'stripeConnectSettings.payoutsEnabled': true,
    }).select('name stripeConnectSettings');

    const summary = [];

    for (const merchant of merchants) {
      const merchantObjectId = merchant._id as mongoose.Types.ObjectId;
      
      const unpaidCount = await Transaction.countDocuments({
        merchantId: merchantObjectId,
        type: 'purchase',
        status: 'completed',
        stripePaidOut: { $ne: true }
      });

      const unpaidAmount = await Transaction.aggregate([
        {
          $match: {
            merchantId: merchantObjectId,
            type: 'purchase',
            status: 'completed',
            stripePaidOut: { $ne: true }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      summary.push({
        merchantId: merchant._id,
        merchantName: merchant.name,
        unpaidTransactions: unpaidCount,
        unpaidAmount: unpaidAmount[0]?.total || 0
      });
    }

    return NextResponse.json({
      success: true,
      connectedMerchants: merchants.length,
      summary
    });

  } catch (error) {
    console.error('Error checking payout status:', error);
    return NextResponse.json(
      { error: 'Failed to check payout status' },
      { status: 500 }
    );
  }
}
