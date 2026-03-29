import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Voucher from '@/models/Voucher';
import RedemptionLog from '@/models/RedemptionLog';
import MerchantLocation from '@/models/MerchantLocation';
import Transaction from '@/models/Transaction';
import GiftItem from '@/models/GiftItem';
import PayoutItem from '@/models/PayoutItem';
import mongoose from 'mongoose';
import { getStripeFee } from '@/lib/stripe-fees';
import { getNextInvoiceNumber } from '@/lib/invoice-counter';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    const { id } = await params;
    const voucherId = id;
    const body = await request.json();
    const { merchantLocationId } = body;

    // Required fields
    if (!merchantLocationId) {
      return NextResponse.json(
        { error: 'Missing required field: merchantLocationId' },
        { status: 400 }
      );
    }

    // Verify merchant location exists
    const merchantLocation = await MerchantLocation.findById(merchantLocationId);
    if (!merchantLocation) {
      return NextResponse.json(
        { error: 'Merchant location not found' },
        { status: 404 }
      );
    }

    // Find voucher by redemption link
    const voucher = await Voucher.findOne({
      redemptionLink: voucherId
    }).populate({
      path: 'giftItemId',
      populate: {
        path: 'merchantId',
        select: 'name _id'
      }
    });

    if (!voucher) {
      return NextResponse.json(
        { error: 'Voucher not found' },
        { status: 404 }
      );
    }

    // Check voucher status
    if (voucher.status === 'redeemed') {
      return NextResponse.json(
        { error: 'Voucher has already been redeemed' },
        { status: 400 }
      );
    }

    // Check if voucher is pending payment confirmation
    if (voucher.status === 'pending') {
      return NextResponse.json(
        { error: 'Voucher payment is still being processed. Please try again later.' },
        { status: 400 }
      );
    }

    // Check if voucher has been refunded
    if (voucher.status === 'refunded') {
      return NextResponse.json(
        { error: 'This voucher has been refunded and is no longer valid.' },
        { status: 400 }
      );
    }

    // Validate that this location is valid for the voucher
    const isValidLocation = voucher.validLocationIds.some(
      (locationId: mongoose.Types.ObjectId) => locationId.toString() === merchantLocationId
    );

    if (!isValidLocation) {
      return NextResponse.json(
        { error: 'This voucher cannot be redeemed at this location' },
        { status: 400 }
      );
    }

    // ============ SQUARE INTEGRATION LOGIC ============
    let squareOrderId = null;
    let squarePaymentId = null;
    let squareIntegrationStatus = {
      isActive: false,
      processed: false,
      message: 'No Square integration configured',
      error: null as string | null,
      priceMismatch: false,
      voucherPrice: 0,
      squarePrice: 0,
      priceDifference: 0,
      shouldBlockRedemption: false, // ✅ NEW: Track if we should block redemption
      blockReason: null as string | null // ✅ NEW: Reason for blocking
    };

    try {
      // Get gift item details for Square check
      const giftItem = await GiftItem.findById(voucher.giftItemId?._id);

      if (giftItem) {
        const merchantId = giftItem.merchantId;

        // Check Square credentials
        const db = mongoose.connection.db;
        if (db) {
          const squareCredentials = await db
            .collection('squareCredentials')
            .findOne({
              merchantId: new ObjectId(merchantId),
            });

          if (squareCredentials) {
            const { accessToken, locationId, isActive = true } = squareCredentials;

            // Set square integration status
            squareIntegrationStatus.isActive = isActive;

            // Condition: Only process Square if active AND product has square_id
            if (isActive && giftItem.square_id && accessToken && locationId) {
              squareIntegrationStatus.processed = true;

              try {
                // ✅ NEW: Check Square environment from .env
                const SQUARE_ENVIRONMENT = process.env.SQUARE_ENVIRONMENT || 'production';
                const squareApiBaseUrl = SQUARE_ENVIRONMENT === 'sandbox'
                  ? 'https://connect.squareupsandbox.com'
                  : 'https://connect.squareup.com';

                console.log(`🔄 Using Square ${SQUARE_ENVIRONMENT} environment: ${squareApiBaseUrl}`);

                // Verify product exists in Square
                const verifyResponse = await fetch(
                  `${squareApiBaseUrl}/v2/catalog/object/${giftItem.square_id}`,
                  {
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                      'Content-Type': 'application/json',
                      'Square-Version': '2024-01-18',
                    },
                  }
                );

                if (!verifyResponse.ok) {
                  console.error('❌ Square product verification failed:', {
                    status: verifyResponse.status,
                    statusText: verifyResponse.statusText,
                    productId: giftItem.square_id,
                    environment: SQUARE_ENVIRONMENT
                  });

                  squareIntegrationStatus.shouldBlockRedemption = true;
                  squareIntegrationStatus.blockReason = 'Square product verification failed';

                  return NextResponse.json(
                    {
                      error: 'This voucher is temporarily unavailable for redemption. Please try again later or contact the merchant'
                    },
                    { status: 400 }
                  );
                }

                const squareItem = await verifyResponse.json();
                const variationData = squareItem.object?.item_variation_data;

                if (!variationData) {
                  console.error('❌ Invalid Square product data:', squareItem);
                  squareIntegrationStatus.shouldBlockRedemption = true;
                  squareIntegrationStatus.blockReason = 'Invalid Square product data';

                  return NextResponse.json(
                    {
                      error: 'This voucher is temporarily unavailable for redemption. Please try again later or contact the merchant'
                    },
                    { status: 400 }
                  );
                }

                // Get prices for comparison (just for logging)
                const voucherPrice = voucher.amount || giftItem.price; // ALWAYS use voucher price
                const squarePrice = variationData?.price_money?.amount
                  ? variationData.price_money.amount / 100
                  : 0;

                const priceDifference = Math.abs(voucherPrice - squarePrice);

                // Log price mismatch but DON'T block redemption
                if (priceDifference > 0.01) {
                  squareIntegrationStatus.priceMismatch = true;
                  squareIntegrationStatus.voucherPrice = voucherPrice;
                  squareIntegrationStatus.squarePrice = squarePrice;
                  squareIntegrationStatus.priceDifference = priceDifference;
                  squareIntegrationStatus.message = `Price mismatch detected. Voucher: €${voucherPrice}, Square: €${squarePrice}. Using voucher price.`;
                  console.warn(squareIntegrationStatus.message);
                }

                // ✅ FIX: Create Square transaction with correct currency and format
                const orderAmount = Math.round(voucherPrice * 100); // VOUCHER PRICE in cents
                const shortVoucherId = voucher._id.toString().slice(-8);

                console.log('🔄 Creating Square order...', {
                  voucherId: voucher._id,
                  productId: giftItem.square_id,
                  amount: orderAmount,
                  currency: 'EUR',
                  // currency: 'USD',
                  locationId: locationId
                });

                // 1. Create Order
                const orderResponse = await fetch(
                  `${squareApiBaseUrl}/v2/orders`,
                  {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                      'Content-Type': 'application/json',
                      'Square-Version': '2024-01-18',
                    },
                    body: JSON.stringify({
                      idempotency_key: `ord_${shortVoucherId}_${Date.now() % 1000000}`,
                      order: {
                        location_id: locationId,
                        line_items: [{
                          quantity: '1',
                          catalog_object_id: giftItem.square_id,
                          name: giftItem.name || 'Gift Item',
                          base_price_money: {
                            amount: orderAmount, // Voucher price in cents
                            currency: 'EUR', // ✅ FIX: Changed from USD to EUR
                            // currency: 'USD',
                          },
                        }],
                        metadata: {
                          brontie_voucher_id: voucher._id.toString(),
                          redemption_code: voucher.redemptionCode,
                          source: 'Brontie App',
                          environment: SQUARE_ENVIRONMENT
                        },
                        state: 'OPEN',
                      },
                    }),
                  }
                );

                let orderData;
                if (!orderResponse.ok) {
                  const errorText = await orderResponse.text();
                  console.error('❌ Square order creation failed:', {
                    status: orderResponse.status,
                    error: errorText,
                    environment: SQUARE_ENVIRONMENT
                  });
                  throw new Error(`Failed to create Square order: ${orderResponse.status} - ${errorText}`);
                }

                orderData = await orderResponse.json();
                squareOrderId = orderData.order?.id;

                console.log('✅ Square order created:', {
                  orderId: squareOrderId,
                  environment: SQUARE_ENVIRONMENT
                });

                // 2. Create External Payment - ✅ FIX: Use correct API endpoint and format
                console.log('🔄 Creating Square payment...', {
                  orderId: squareOrderId,
                  amount: orderAmount
                });

                const paymentResponse = await fetch(
                  `${squareApiBaseUrl}/v2/payments`,
                  {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                      'Content-Type': 'application/json',
                      'Square-Version': '2024-01-18',
                    },
                    body: JSON.stringify({
                      idempotency_key: `pay_${shortVoucherId}_${Date.now() % 1000000}`,
                      source_id: 'EXTERNAL',
                      amount_money: {
                        amount: orderAmount, // Voucher price in cents
                        currency: 'EUR', // ✅ FIX: Changed from USD to EUR
                        // currency: 'USD',
                      },
                      location_id: locationId, // ✅ FIX: Explicitly set locationId to match Order
                      order_id: squareOrderId,
                      external_details: {
                        type: 'EXTERNAL', // ✅ FIX: Changed from SQUARE_CASH to EXTERNAL
                        source: 'Brontie',
                        source_id: voucher._id.toString(),
                      },
                      note: `Brontie Voucher: ${voucher.redemptionCode} (${SQUARE_ENVIRONMENT})`,
                    }),
                  }
                );

                if (!paymentResponse.ok) {
                  const errorText = await paymentResponse.text();
                  console.error('❌ Square payment creation failed:', {
                    status: paymentResponse.status,
                    error: errorText,
                    environment: SQUARE_ENVIRONMENT
                  });

                  // ✅ FIX: Block redemption if payment fails
                  squareIntegrationStatus.shouldBlockRedemption = true;
                  squareIntegrationStatus.blockReason = `Square payment failed: ${paymentResponse.status}`;

                  // Cancel the order if payment failed
                  if (squareOrderId) {
                    try {
                      await fetch(
                        `${squareApiBaseUrl}/v2/orders/${squareOrderId}/cancel`,
                        {
                          method: 'POST',
                          headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Square-Version': '2024-01-18',
                          },
                        }
                      );
                      console.log('✅ Square order cancelled due to payment failure');
                    } catch (cancelError) {
                      console.error('Failed to cancel order:', cancelError);
                    }
                  }

                  return NextResponse.json(
                    {
                      error: 'This voucher is temporarily unavailable for redemption. Please try again later or contact the merchant'
                    },
                    { status: 400 }
                  );
                }

                const paymentData = await paymentResponse.json();
                squarePaymentId = paymentData.payment?.id;

                console.log('✅ Square payment created:', {
                  paymentId: squarePaymentId,
                  environment: SQUARE_ENVIRONMENT
                });

                // 3. Complete order - DISABLED to keep order ACTIVE in Square POS
                /*
                try {
                  const completeResponse = await fetch(
                    `${squareApiBaseUrl}/v2/orders/${squareOrderId}/complete`,
                    {
                      method: 'POST',
                      headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                        'Square-Version': '2024-01-18',
                      },
                    }
                  );

                  if (completeResponse.ok) {
                    console.log('✅ Square order completed successfully');
                  } else {
                    console.warn('⚠️ Square order completion warning:', await completeResponse.text());
                  }
                } catch (completeError) {
                  console.warn('⚠️ Order completion warning:', completeError);
                  // Continue anyway since payment was successful
                }
                */

                squareIntegrationStatus.message = squareIntegrationStatus.priceMismatch
                  ? `Square transaction completed with price mismatch. Voucher price (€${voucherPrice}) used.`
                  : 'Square transaction completed successfully';

              } catch (squareError: any) {
                // ✅ FIX: Block redemption on Square errors
                console.error('❌ Square transaction failed:', squareError);
                squareIntegrationStatus.error = squareError.message;
                squareIntegrationStatus.shouldBlockRedemption = true;
                squareIntegrationStatus.blockReason = `Square transaction failed: ${squareError.message}`;

                return NextResponse.json(
                  {
                    error: 'This voucher is temporarily unavailable for redemption. Please try again later or contact the merchant'
                  },
                  { status: 400 }
                );
              }
            } else if (isActive && !giftItem.square_id) {
              // ✅ FIX: Block redemption if Square active but product not synced
              console.log(giftItem);
              console.log(isActive);
              console.log(giftItem.square_id);
              squareIntegrationStatus.shouldBlockRedemption = true;
              squareIntegrationStatus.blockReason = 'Product not synced with Square';

              return NextResponse.json(
                {
                  error: 'This voucher is temporarily unavailable for redemption. Please try again later or contact the merchant.',
                  code: 'SQUARE_PRODUCT_NOT_SYNCED'
                },
                { status: 400 }
              );
            } else if (isActive && (!accessToken || !locationId)) {
              // ✅ FIX: Block redemption if Square credentials incomplete
              squareIntegrationStatus.shouldBlockRedemption = true;
              squareIntegrationStatus.blockReason = 'Square credentials incomplete';

              return NextResponse.json(
                {
                  error: 'This voucher is temporarily unavailable for redemption. Please try again later or contact the merchant'
                },
                { status: 400 }
              );
            } else {
              // Square inactive or not configured - allow redemption
              squareIntegrationStatus.message = isActive
                ? 'Square configured but not processed (product not synced or credentials incomplete)'
                : 'Square integration inactive';
            }
          } else {
            // No Square credentials - allow redemption
            squareIntegrationStatus.message = 'No Square integration configured';
          }
        }
      }
    } catch (squareCheckError) {
      console.error('❌ Square check error:', squareCheckError);
      // ✅ FIX: Block redemption on Square check errors
      squareIntegrationStatus.shouldBlockRedemption = true;
      squareIntegrationStatus.blockReason = `Square check failed: ${squareCheckError}`;

      return NextResponse.json(
        {
          error: 'This voucher is temporarily unavailable for redemption. Please try again later or contact the merchant'
        },
        { status: 400 }
      );
    }
    // ============ END SQUARE INTEGRATION LOGIC ============

    // ✅ IMPORTANT: Only proceed with redemption if Square order AND payment were successful
    if (squareIntegrationStatus.isActive && (!squareOrderId || !squarePaymentId)) {
      console.error('❌ Square integration failed: Order or payment missing', {
        hasOrder: !!squareOrderId,
        hasPayment: !!squarePaymentId,
        blockReason: squareIntegrationStatus.blockReason
      });

      return NextResponse.json(
        {
          error: 'This voucher is temporarily unavailable for redemption. Please try again later or contact the merchant'
        },
        { status: 400 }
      );
    }

    // Update voucher status
    voucher.status = 'redeemed';
    voucher.redeemedAt = new Date();

    // Save Square IDs if available
    if (squareOrderId) voucher.squareOrderId = squareOrderId;
    if (squarePaymentId) voucher.squarePaymentId = squarePaymentId;

    await voucher.save();

    // Create redemption log with price mismatch info
    await RedemptionLog.create({
      voucherId: voucher._id,
      merchantLocationId,
      timestamp: new Date(),
      squareOrderId,
      squarePaymentId,
      squareVerified: !!(squareOrderId && squarePaymentId),
      squareIntegrationStatus: squareIntegrationStatus.message,
      squareError: squareIntegrationStatus.error,
      priceMismatch: squareIntegrationStatus.priceMismatch,
      voucherPrice: squareIntegrationStatus.voucherPrice,
      squarePrice: squareIntegrationStatus.squarePrice,
      priceDifference: squareIntegrationStatus.priceDifference,
      shouldBlockRedemption: squareIntegrationStatus.shouldBlockRedemption,
      blockReason: squareIntegrationStatus.blockReason
    });

    // Create redemption transaction with Square info
    await createRedemptionTransaction(voucher, merchantLocation, squareOrderId, squarePaymentId);

    // Create purchase transaction with Square info
    await createPurchaseTransaction(voucher, squareOrderId, squarePaymentId);

    // Prepare response
    const responseData: any = {
      success: true,
      message: 'Voucher redeemed successfully',
      voucher: {
        id: voucher._id,
        giftItemId: voucher.giftItemId,
        redeemedAt: voucher.redeemedAt,
        recipientName: voucher.recipientName,
        senderName: voucher.senderName,
        amount: voucher.amount || voucher.giftItemId.price,
        squareOrderId,
        squarePaymentId,
        squareVerified: !!(squareOrderId && squarePaymentId),
      },
      merchantLocation: {
        name: merchantLocation.name,
        address: merchantLocation.address
      },
      squareIntegration: {
        isActive: squareIntegrationStatus.isActive,
        processed: squareIntegrationStatus.processed,
        message: squareIntegrationStatus.message,
        priceMismatch: squareIntegrationStatus.priceMismatch,
        ...(squareOrderId && { orderId: squareOrderId }),
        ...(squarePaymentId && { paymentId: squarePaymentId }),
        ...(squareIntegrationStatus.error && { error: squareIntegrationStatus.error }),
        ...(squareIntegrationStatus.priceMismatch && {
          priceInfo: {
            voucherPrice: squareIntegrationStatus.voucherPrice,
            squarePrice: squareIntegrationStatus.squarePrice,
            difference: squareIntegrationStatus.priceDifference,
            note: 'Voucher price was used for transaction'
          }
        })
      }
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('Error redeeming voucher:', error);
    return NextResponse.json(
      { error: 'Failed to redeem voucher' },
      { status: 500 }
    );
  }
}

// Updated function to create redemption transaction with Square info
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createRedemptionTransaction(
  voucher: any,
  merchantLocation: any,
  squareOrderId?: string | null,
  squarePaymentId?: string | null
) {
  try {
    if (!voucher.giftItemId || !voucher.giftItemId.merchantId) {
      console.error('Gift item or merchant not found for redemption transaction');
      return;
    }

    const amount = voucher.amount || voucher.giftItemId.price;

    // Get next invoice number
    const invoiceNumber = await getNextInvoiceNumber();

    // Create redemption transaction record
    const transaction = new Transaction({
      voucherId: voucher._id,
      merchantId: voucher.giftItemId.merchantId._id,
      giftItemId: voucher.giftItemId._id,
      type: 'redemption',
      amount: amount,
      status: 'completed',
      customerEmail: voucher.email,
      senderName: voucher.senderName,
      recipientName: voucher.recipientName,
      completedAt: new Date(),
      invoiceNumber: invoiceNumber,
      squareOrderId: squareOrderId || null,
      squarePaymentId: squarePaymentId || null,
      squareVerified: !!(squareOrderId && squarePaymentId)
    });

    await transaction.save();

    console.log('Redemption transaction created:', {
      transactionId: transaction._id,
      voucherId: voucher._id,
      merchantId: voucher.giftItemId.merchantId._id,
      amount: amount,
      locationId: merchantLocation._id,
      squareOrderId: squareOrderId,
      squarePaymentId: squarePaymentId
    });

  } catch (error) {
    console.error('Error creating redemption transaction:', error);
    // Don't throw error to avoid redemption failure
  }
}

// Updated function to create purchase transaction with Square info
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createPurchaseTransaction(
  voucher: any,
  squareOrderId?: string | null,
  squarePaymentId?: string | null
) {
  try {
    // Get gift item with merchant details
    const giftItem = await GiftItem.findById(voucher.giftItemId).populate('merchantId');
    if (!giftItem || !giftItem.merchantId) {
      console.error('Gift item or merchant not found for purchase transaction');
      return;
    }

    const merchant = giftItem.merchantId;
    const amount = voucher.amount || giftItem.price; // VOUCHER PRICE

    // Get actual Stripe fee if available, otherwise use stored fee or estimate
    let stripeFee = voucher.stripeFee || 0;
    if (!stripeFee && voucher.paymentIntentId) {
      stripeFee = await getStripeFee(voucher.paymentIntentId, amount);
    }
    if (!stripeFee) {
      // Fallback to estimated fee (1.4% + €0.25)
      stripeFee = (amount * 0.014) + 0.25;
    }

    // Check if Brontie fee is active
    const isBrontieFeeActive = merchant.brontieFeeSettings && merchant.brontieFeeSettings.isActive;
    const netAfterStripe = amount - stripeFee;
    const brontieCommission = isBrontieFeeActive ? amount * 0.10 : 0;
    const merchantPayout = netAfterStripe - brontieCommission;

    // Get next invoice number
    const invoiceNumber = await getNextInvoiceNumber();

    // Create purchase transaction record
    const transaction = new Transaction({
      voucherId: voucher._id,
      merchantId: merchant._id,
      giftItemId: giftItem._id,
      type: 'purchase',
      amount: amount,
      status: 'completed',
      customerEmail: voucher.email,
      senderName: voucher.senderName,
      recipientName: voucher.recipientName,
      stripeFee: stripeFee,
      brontieCommission: brontieCommission,
      merchantPayout: merchantPayout,
      completedAt: new Date(),
      invoiceNumber: invoiceNumber,
      squareOrderId: squareOrderId || null,
      squarePaymentId: squarePaymentId || null,
      squareVerified: !!(squareOrderId && squarePaymentId)
    });

    await transaction.save();
    console.log('Purchase transaction created:', transaction._id);

    // Create payout item for this redemption
    const payoutItem = new PayoutItem({
      voucherId: voucher._id,
      merchantId: merchant._id,
      amountPayable: merchantPayout,
      brontieFee: brontieCommission,
      stripeFee: stripeFee,
      status: 'pending',
      squareOrderId: squareOrderId || null,
      squarePaymentId: squarePaymentId || null,
      squareVerified: !!(squareOrderId && squarePaymentId)
    });

    await payoutItem.save();
    console.log('Payout item created:', payoutItem._id);
  } catch (error) {
    console.error('Error creating purchase transaction:', error);
  }
}