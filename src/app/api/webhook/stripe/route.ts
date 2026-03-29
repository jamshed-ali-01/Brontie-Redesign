import { getStripe } from '@/lib/stripe';
import Voucher from '@/models/Voucher';
import { connectToDatabase } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import GiftItem from '@/models/GiftItem';
import Transaction from '@/models/Transaction';
import Merchant from '@/models/Merchant';
import BulkDashboard from '@/models/BulkDashboard';
import { nanoid } from 'nanoid';
import Stripe from 'stripe';
import { sendPaymentSuccessEmail, sendBulkDashboardEmail } from '@/lib/email';
import { getStripeFee } from '@/lib/stripe-fees';
import { getNextInvoiceNumber } from '@/lib/invoice-counter';
import { SERVICE_FEE_PERCENT } from '@/lib/constants';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe signature' },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    const stripe = await getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || '',
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(
        event.data.object as Stripe.Checkout.Session,
      );
      break;
    case 'charge.refunded':
      await handleChargeRefunded(event.data.object as Stripe.Charge);
      break;
    case 'charge.dispute.created':
    case 'charge.dispute.updated':
    case 'charge.dispute.closed':
      await handleChargeDispute(event.data.object as Stripe.Dispute);
      break;
    case 'account.updated':
      await handleAccountUpdated(event.data.object as Stripe.Account);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    await connectToDatabase();

    const metadata = session.metadata || {};
    const { giftItemId, refToken, qrShortId } = metadata;

    if (!giftItemId) {
      console.error('Missing giftItemId in session metadata');
      return;
    }

    console.log('Processing checkout completion for giftItemId:', giftItemId);

    const giftItem = await GiftItem.findById(giftItemId);
    if (!giftItem) {
      console.error('Gift item not found:', giftItemId);
      return;
    }

    const amountTotal = (session.amount_total || 0) / 100;
    const actualStripeFee = await getStripeFee(
      session.payment_intent as string,
      amountTotal,
    );

    const giftCount = metadata.gift_count ? parseInt(metadata.gift_count) : 1;

    // ✅ FIXED: Only strip out the service fee if this was actually a bulk dashboard order
    let unitAmount = amountTotal / giftCount;
    if (giftCount > 1 && metadata.isBulkDashboard === 'true') {
      unitAmount = (amountTotal / (1 + SERVICE_FEE_PERCENT)) / giftCount;
    }

    const unitStripeFee = actualStripeFee / giftCount;

    const buyerEmail = session.customer_details?.email;

    console.log(`Processing ${giftCount} vouchers for session ${session.id}`);

    const existingVouchersCount = await Voucher.countDocuments({ stripeSessionId: session.id });
    if (existingVouchersCount >= giftCount) {
      console.log(`[Webhook] Skipping creation: ${existingVouchersCount} vouchers already exist for session ${session.id} (likely created by Fallback).`);
      return;
    }

    let bulkDashboardId = null;
    let magicLinkToken = null;
    if (metadata.isBulkDashboard === 'true') {
      console.log(`[Webhook] Creating Bulk Dashboard for ${metadata.buyerEmail || buyerEmail}`);
      magicLinkToken = nanoid(32);
      let parsedAdmins: string[] = [];
      if (metadata.adminEmails) {
        try { parsedAdmins = JSON.parse(metadata.adminEmails); } catch (e) { }
      }
      const newDashboard = await BulkDashboard.create({
        ownerEmail: metadata.buyerEmail || buyerEmail,
        magicLinkToken,
        admins: parsedAdmins,
      });
      bulkDashboardId = newDashboard._id;
    }

    const createdVouchers = [];

    for (let i = 0; i < giftCount; i++) {
      let giftData: any = {};

      if (metadata[`gift_${i}`]) {
        try {
          giftData = JSON.parse(metadata[`gift_${i}`] || '{}');
        } catch (e) {
          console.error(`Failed to parse gift data for index ${i}`, e);
        }
      } else {
        giftData = {
          recipientName: metadata.recipientName,
          senderName: metadata.senderName,
          recipientEmail: metadata.recipientEmail,
          senderEmail: metadata.senderEmail,
          message: metadata.message,
          messageCardId: metadata.messageCardId,
          isOrganization: metadata.isOrganization,
          organizationId: metadata.organizationId,
          recipientToken: metadata.recipientToken,
        }
      }

      const redemptionCode = nanoid(10);
      const redemptionLink = redemptionCode;
      const recipientToken = giftData.recipientToken || '';

      const voucher = new Voucher({
        redemptionCode,
        giftItemId: giftItem._id,
        status: 'issued',
        issuedAt: new Date(),
        confirmedAt: new Date(),
        messageCardId: giftData.messageCardId,
        expiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
        senderName: giftData.senderName || 'Anonymous',
        recipientName: giftData.recipientName || '',
        email: buyerEmail,
        recipientEmail: giftData.recipientEmail || '',
        redemptionLink,
        validLocationIds: giftItem.locationIds,
        paymentIntentId: session.payment_intent,
        stripeSessionId: session.id,
        amount: unitAmount,
        amountGross: unitAmount,
        stripeFee: unitStripeFee,
        productSku: metadata.productSku || giftItem.name,
        bulkDashboardId,
        recipientToken: recipientToken || crypto.randomUUID(),
        recipientBecameSender: false,
        recipientLinkedSenderEmail: buyerEmail || '',
        message: giftData.message || '',
        qrShortId: qrShortId || '',
        isOrganization: String(giftData.isOrganization) === 'true',
        organizationId: giftData.organizationId || null,
      });

      await voucher.save();
      createdVouchers.push(voucher);
      console.log(`Voucher ${i + 1}/${giftCount} created: ${voucher._id}`);

      console.log('Viral loop check:', {
        refToken,
        recipientToken,
        hasRefToken: !!refToken,
        hasRecipientToken: !!recipientToken,
      });

      if (refToken && recipientToken) {
        try {
          const originalVoucher = await Voucher.findOne({
            recipientToken: refToken,
          });

          console.log('Viral loop - searching for original voucher with recipientToken:', refToken);
          console.log('Viral loop - original voucher found:', !!originalVoucher);

          if (originalVoucher) {
            originalVoucher.recipientBecameSender = true;
            originalVoucher.recipientLinkedSenderEmail =
              giftData.senderEmail || buyerEmail || '';
            await originalVoucher.save();

            console.log('✅ Viral loop tracked successfully:', {
              originalVoucherId: originalVoucher._id,
              newVoucherId: voucher._id,
              refToken,
              recipientToken,
              senderEmail: giftData.senderEmail || buyerEmail,
            });
          } else {
            console.log('❌ Viral loop - original voucher NOT found for refToken:', refToken);
          }
        } catch (viralError) {
          console.error('Error processing viral loop:', viralError);
        }
      } else {
        console.log(
          '⚠️ Viral loop - tokens missing. refToken:',
          refToken || 'MISSING',
          'recipientToken:',
          recipientToken || 'MISSING',
        );
      }
    }

    if (buyerEmail) {
      if (metadata.isBulkDashboard === 'true' && magicLinkToken) {
        const updateResult = await Voucher.updateMany(
          { stripeSessionId: session.id, isEmailSent: { $ne: true } },
          { $set: { isEmailSent: true } }
        );

        if (updateResult.modifiedCount > 0) {
          const mainBuyerEmail = metadata.buyerEmail || buyerEmail;
          const giftItemData = await GiftItem.findById(giftItem._id).populate('merchantId');

          await sendBulkDashboardEmail(
            mainBuyerEmail,
            magicLinkToken,
            createdVouchers,
            giftItemData,
            giftCount
          );

          // If a separate receipt email was provided during checkout, also send the magic link there
          if (metadata.receiptEmail && metadata.receiptEmail.toLowerCase() !== mainBuyerEmail.toLowerCase()) {
            await sendBulkDashboardEmail(
              metadata.receiptEmail,
              magicLinkToken,
              createdVouchers,
              giftItemData,
              giftCount
            );
          }
        } else {
          console.log("[Webhook] Bulk email already sent by frontend API or another webhook. Skipping duplicate.");
        }
      } else {
        try {
          const populatedVouchers = await Promise.all(
            createdVouchers.map(v => Voucher.findById(v._id).populate({
              path: 'giftItemId', populate: { path: 'merchantId', select: 'name' }
            }))
          );

          const validVouchers = populatedVouchers.filter(v => v !== null);
          if (validVouchers.length > 0) {
            const voucherIds = validVouchers.map(v => v!._id);
            const updateResult = await Voucher.updateMany(
              { _id: { $in: voucherIds }, isEmailSent: { $ne: true } },
              { $set: { isEmailSent: true } }
            );

            if (updateResult.modifiedCount > 0) {
              await sendPaymentSuccessEmail(buyerEmail, validVouchers.map(v => ({
                giftItemId: {
                  name: v!.giftItemId.name,
                  price: v!.giftItemId.price,
                  merchantId: { name: v!.giftItemId.merchantId.name },
                },
                senderName: v!.senderName || 'Anonymous',
                recipientName: v!.recipientName || '',
                redemptionLink: v!.redemptionLink,
                status: v!.status,
              })));
            } else {
              console.log("[Webhook] Standard email already sent by frontend API or another webhook. Skipping duplicate.");
            }
          }
        } catch (err) {
          console.error("Email error", err);
        }
      }
    }

  } catch (error) {
    console.error('Error handling checkout completion:', error);
    throw error;
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  try {
    await connectToDatabase();

    const isFullRefund = charge.amount_refunded === charge.amount;

    if (!isFullRefund) {
      console.log('Partial refund detected, not invalidating voucher');
      return;
    }

    const paymentIntentId = charge.payment_intent;

    if (!paymentIntentId) {
      console.error('Missing payment intent ID in charge object');
      return;
    }

    console.log('Processing refund for payment intent:', paymentIntentId);

    const voucher = await Voucher.findOne({ paymentIntentId });

    if (!voucher) {
      console.error('No voucher found for payment intent:', paymentIntentId);
      return;
    }

    if (voucher.status === 'redeemed') {
      console.error('Cannot refund a redeemed voucher:', voucher._id);
      return;
    }

    voucher.status = 'refunded';
    voucher.refundedAt = new Date();
    await voucher.save();

    await createRefundTransaction(voucher, charge);

    console.log('Voucher invalidated due to refund:', {
      voucherId: voucher._id,
      redemptionLink: voucher.redemptionLink,
      paymentIntentId,
    });
  } catch (error) {
    console.error('Error handling charge refunded:', error);
    throw error;
  }
}

async function createRefundTransaction(voucher: any, charge: Stripe.Charge) {
  try {
    const giftItem = await GiftItem.findById(voucher.giftItemId).populate('merchantId');
    if (!giftItem || !giftItem.merchantId) {
      console.error('Gift item or merchant not found for refund transaction');
      return;
    }

    const amount = (charge.amount_refunded || 0) / 100;
    const invoiceNumber = await getNextInvoiceNumber();

    const transaction = new Transaction({
      voucherId: voucher._id,
      merchantId: giftItem.merchantId._id,
      giftItemId: giftItem._id,
      type: 'refund',
      amount: amount,
      status: 'completed',
      customerEmail: voucher.email,
      senderName: voucher.senderName,
      recipientName: voucher.recipientName,
      stripePaymentIntentId: charge.payment_intent,
      completedAt: new Date(),
      invoiceNumber: invoiceNumber
    });

    await transaction.save();

    console.log('Refund transaction created:', {
      transactionId: transaction._id,
      voucherId: voucher._id,
      merchantId: giftItem.merchantId._id,
      amount: amount,
      chargeId: charge.id,
    });
  } catch (error) {
    console.error('Error creating refund transaction:', error);
  }
}

async function handleChargeDispute(dispute: Stripe.Dispute) {
  try {
    await connectToDatabase();

    console.log('Processing dispute for charge:', dispute.charge);

    const stripe = await getStripe();
    const charge = await stripe.charges.retrieve(dispute.charge as string);
    const paymentIntentId = charge.payment_intent;

    if (!paymentIntentId) {
      console.error('Missing payment intent ID in charge object');
      return;
    }

    const voucher = await Voucher.findOne({ paymentIntentId });

    if (!voucher) {
      console.error('No voucher found for payment intent:', paymentIntentId);
      return;
    }

    voucher.status = 'disputed';
    await voucher.save();

    await createDisputeTransaction(voucher, dispute, charge);

    console.log('Voucher marked as disputed:', {
      voucherId: voucher._id,
      redemptionLink: voucher.redemptionLink,
      paymentIntentId,
      disputeId: dispute.id,
      disputeReason: dispute.reason,
    });
  } catch (error) {
    console.error('Error handling charge dispute:', error);
    throw error;
  }
}

async function createDisputeTransaction(
  voucher: any,
  dispute: Stripe.Dispute,
  charge: Stripe.Charge,
) {
  try {
    const giftItem = await GiftItem.findById(voucher.giftItemId).populate('merchantId');
    if (!giftItem || !giftItem.merchantId) {
      console.error('Gift item or merchant not found for dispute transaction');
      return;
    }

    const amount = (charge.amount || 0) / 100;
    const invoiceNumber = await getNextInvoiceNumber();

    const transaction = new Transaction({
      voucherId: voucher._id,
      merchantId: giftItem.merchantId._id,
      giftItemId: giftItem._id,
      type: 'purchase',
      amount: amount,
      status: 'failed',
      customerEmail: voucher.email,
      senderName: voucher.senderName,
      recipientName: voucher.recipientName,
      stripePaymentIntentId: charge.payment_intent,
      completedAt: new Date(),
      invoiceNumber: invoiceNumber
    });

    await transaction.save();

    console.log('Dispute transaction created:', {
      transactionId: transaction._id,
      voucherId: voucher._id,
      merchantId: giftItem.merchantId._id,
      amount: amount,
      disputeId: dispute.id,
      disputeReason: dispute.reason,
    });
  } catch (error) {
    console.error('Error creating dispute transaction:', error);
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  try {
    await connectToDatabase();

    console.log('Stripe Connect account updated:', {
      accountId: account.id,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    });

    const merchant = await Merchant.findOne({
      'stripeConnectSettings.accountId': account.id,
    });

    if (!merchant) {
      console.log('Merchant not found for Stripe account:', account.id);
      return;
    }

    merchant.stripeConnectSettings = {
      accountId: account.id,
      isConnected: account.details_submitted && account.charges_enabled,
      onboardingCompleted: account.details_submitted || false,
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      detailsSubmitted: account.details_submitted || false,
    };

    await merchant.save();

    console.log('✅ Merchant Stripe Connect settings updated:', {
      merchantId: merchant._id,
      merchantName: merchant.name,
      isConnected: merchant.stripeConnectSettings.isConnected,
      onboardingCompleted: merchant.stripeConnectSettings.onboardingCompleted,
    });
  } catch (error) {
    console.error('Error updating merchant Stripe Connect settings:', error);
  }
}
