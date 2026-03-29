import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import GiftItem from '@/models/GiftItem';
import { getStripe } from '@/lib/stripe';
import { SERVICE_FEE_PERCENT } from '@/lib/constants';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const {
      // prevRedemptionLink,
      ref,
      message,
      qrShortId,
      senderName,
      giftItemId,
      senderEmail,
      recipientName,
      recipientEmail,
      messageCardId,
    } = body;


    console.log('body console from api checkout ')
    console.log(body)

    // Validate required fields
    if (!giftItemId)
      return NextResponse.json(
        { error: 'Missing required field: giftItemId' },
        { status: 400 },
      );

    // Get gift item details
    const giftItem = await GiftItem.findById(giftItemId)
      .populate('merchantId')
      .populate('locationIds');

    if (!giftItem)
      return NextResponse.json(
        { error: 'Gift item not found' },
        { status: 404 },
      );

    if (!giftItem.isActive)
      return NextResponse.json(
        { error: 'Gift item is not available' },
        { status: 400 },
      );

    // Create Stripe checkout session
    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      'http://localhost:3000';

    const qty = body.quantity || (body.gifts ? body.gifts.length : 1);
    const baseAmountCents = Math.round(giftItem.price * qty * 100);
    const feeAmountCents = Math.round(baseAmountCents * SERVICE_FEE_PERCENT);

    const sessionPayload: any = {
      payment_method_types: ['card', 'revolut_pay'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${giftItem.name} — ${giftItem.merchantId.name}`,
              description: `${qty} × €${giftItem.price.toFixed(2)}`,
              images: giftItem.imageUrl ? [giftItem.imageUrl] : [],
            },
            unit_amount: baseAmountCents, // Total amount in cents
          },
          quantity: 1, // Aggregate into 1 line item to hide default Qty and allow custom description
        },
      ],
      mode: 'payment',
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/product/${giftItemId}`,
      metadata: {
        giftItemId: giftItemId,
        refToken: ref || '',
        qrShortId: qrShortId || '',
        productSku: giftItem.name,
        merchantId: giftItem.merchantId._id.toString(),
      },
    };

    // Only add service fee for bulk dashboard or org (if indicated, or just always for bulk qty>1)
if (body.isBulkDashboard === true && body.quantity && body.quantity > 1) {
  sessionPayload.line_items.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Brontie Service Fee (${SERVICE_FEE_PERCENT * 100}%)`,
          },
          unit_amount: feeAmountCents,
        },
        quantity: 1,
      });
    }

    if (body.receiptEmail) {
      sessionPayload.customer_email = body.receiptEmail;
      sessionPayload.metadata.receiptEmail = body.receiptEmail;
    }

    // Handle modern pure-quantity Bulk Dashboard or Organization donations (No explicit array)
    if (body.quantity && body.quantity > 1 && !body.gifts) {
      sessionPayload.metadata.gift_count = body.quantity.toString();
      sessionPayload.metadata.senderName = senderName || 'Anonymous';
      sessionPayload.metadata.message = message || '';
      sessionPayload.metadata.buyerEmail = body.buyerEmail || body.senderEmail || '';

      if (body.isBulkDashboard) {
        sessionPayload.metadata.isBulkDashboard = 'true';
        if (body.magicLinkToken) {
          sessionPayload.metadata.magicLinkToken = body.magicLinkToken;
        }
      } else if (body.isOrganization) {
        sessionPayload.metadata.isOrganization = 'true';
        sessionPayload.metadata.organizationId = body.organizationId || '';
      }
    }
    // Handle Array-based Bulk Gifts
    else if (body.gifts && Array.isArray(body.gifts) && body.gifts.length > 0) {
      sessionPayload.metadata.gift_count = body.gifts.length.toString();

      // Inject bulk dashboard info if provided (for team/event purchases)
      if (body.isBulkDashboard) {
        sessionPayload.metadata.isBulkDashboard = 'true';
        sessionPayload.metadata.buyerEmail = body.buyerEmail || '';
        if (body.adminEmails && Array.isArray(body.adminEmails)) {
          sessionPayload.metadata.adminEmails = JSON.stringify(body.adminEmails);
        }
        if (body.magicLinkToken) {
          sessionPayload.metadata.magicLinkToken = body.magicLinkToken;
        }
      }

      body.gifts.forEach((gift: any, index: number) => {
        // Pack gift details into JSON to save metadata keys
        const giftData = {
          recipientName: gift.recipientName || '',
          senderName: gift.senderName || 'Anonymous',
          message: gift.message || '',
          messageCardId: gift.messageCardId || '',
          isOrganization: gift.isOrganization || false,
          organizationId: gift.organizationId || '',
          recipientEmail: gift.recipientEmail || '',
        };
        sessionPayload.metadata[`gift_${index}`] = JSON.stringify(giftData);
      });
    } else {
      // Legacy / Single Gift Fallback
      sessionPayload.metadata.recipientName = recipientName || '';
      sessionPayload.metadata.senderName = senderName || 'Anonymous';
      sessionPayload.metadata.recipientEmail = recipientEmail || '';
      sessionPayload.metadata.senderEmail = senderEmail || '';
      sessionPayload.metadata.message = message || '';
      sessionPayload.metadata.messageCardId = messageCardId || '';
      sessionPayload.metadata.isOrganization = body.isOrganization ? 'true' : 'false';
      sessionPayload.metadata.organizationId = body.organizationId || '';
      sessionPayload.metadata.recipientToken = crypto.randomUUID(); // Only for single legacy flow
    }

    const stripe = await getStripe();
    const session = await stripe.checkout.sessions.create(sessionPayload);

    console.log('Stripe checkout session created:', {
      sessionId: session.id,
      giftItemId,
      amount: giftItem.price,
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 },
    );
  }
}
