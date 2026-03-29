import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Voucher from "@/models/Voucher";
import GiftItem from "@/models/GiftItem";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import MerchantLocation from "@/models/MerchantLocation";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Merchant from "@/models/Merchant";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Category from "@/models/Category";
import BulkDashboard from "@/models/BulkDashboard";
import { getStripe, stripe } from "@/lib/stripe";
import { nanoid } from "nanoid";
import { sendPaymentSuccessEmail, sendBulkDashboardEmail } from "@/lib/email";
import { Document } from "mongoose";
import mongoose from "mongoose";
import { SERVICE_FEE_PERCENT } from "@/lib/constants";


import "@/models/Organization";
import "@/models/Merchant";
import "@/models/MerchantLocation";
import "@/models/Category";

// Function to wait for vouchers with retry logic
async function waitForVouchersWithRetry(
  paymentIntentId: string,
  expectedCount: number = 1,
  maxAttempts: number = 5
) {
  let attempts = 0;

  console.log(
    `[waitForVouchersWithRetry] Starting to look for ${expectedCount} voucher(s) with paymentIntentId: ${paymentIntentId}`
  );

  while (attempts < maxAttempts) {
    try {
      const vouchers = await Voucher.find({ paymentIntentId })
        .populate("organizationId")
        .populate({
          path: "giftItemId",
          populate: { path: "merchantId" },
        });

      if (vouchers.length >= expectedCount) {
        return vouchers;
      }
    } catch (error) {
      console.error(
        `[waitForVouchersWithRetry] Error on attempt ${attempts + 1}:`,
        error
      );
    }

    attempts++;
    if (attempts < maxAttempts) {
      const delay = attempts * 1000;
      console.log(
        `[waitForVouchersWithRetry] Attempt ${attempts}/${maxAttempts}: Found 0/${expectedCount}, retrying in ${delay}ms`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.log(
    `[waitForVouchersWithRetry] Expected vouchers not found after ${maxAttempts} attempts`
  );
  return [];
}

// Function to send payment success email
async function sendPaymentSuccessEmailIfNeeded(
  vouchers: (Document & { _id: string; email?: string;[key: string]: unknown })[],
  customerEmail?: string
) {
  if (vouchers.length === 0) return;

  try {
    // Use the email from the first voucher or fallback to customerEmail
    const emailToUse = vouchers[0].email || customerEmail;

    if (!emailToUse) {
      console.log("No email available for payment success email");
      return;
    }

    // Populate all vouchers with gift item details for email
    // We need to fetch/populate each one to get the merchant details
    const populatedVouchers = await Promise.all(
      vouchers.map(v =>
        Voucher.findById(v._id).populate({
          path: "giftItemId",
          populate: {
            path: "merchantId",
            select: "name",
          },
        })
      )
    );

    // Filter out any nulls if finding failed
    const validVouchers = populatedVouchers.filter(v => v !== null);

    if (validVouchers.length > 0) {
      // Map to the VoucherData interface expected by the email function
      const emailVouchersData = validVouchers.map(v => ({
        giftItemId: {
          name: v.giftItemId.name,
          price: v.giftItemId.price,
          merchantId: {
            name: v.giftItemId.merchantId.name,
          },
        },
        senderName: v.senderName || "Anonymous",
        recipientName: v.recipientName || "",
        redemptionLink: v.redemptionLink,
        status: v.status,
        recipientToken: v.recipientToken, // Assuming this field exists on the mongoose doc or is virtual
        isOrganization: v.isOrganization,
      }));

      // Send a single email with ALL vouchers
      const emailSent = await sendPaymentSuccessEmail(emailToUse, emailVouchersData);

      if (emailSent) {
        console.log(`Payment success email sent to ${emailToUse} with ${validVouchers.length} vouchers`);
      } else {
        console.error(`Failed to send payment success email to ${emailToUse}`);
      }
    }
  } catch (emailError) {
    console.error("Error sending payment success email:", emailError);
    // Don't throw the error to avoid API failure
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const voucherId = searchParams.get("voucher_id");
    const sessionId = searchParams.get("session_id");

    console.log(
      `[Checkout Success] Processing request with voucherId: ${voucherId}, sessionId: ${sessionId}`
    );

    await connectToDatabase();

    // For development mode, use voucher_id directly
    if (voucherId) {
      console.log(
        `[Checkout Success] Development mode - finding voucher by ID: ${voucherId}`
      );
      // Find the voucher by ID directly
      const voucher = await Voucher.findById(voucherId).populate({
        path: "giftItemId",
        populate: {
          path: "merchantId",
          select: "name",
        },
      });

      if (!voucher) {
        console.error(
          `[Checkout Success] Voucher not found for ID: ${voucherId}`
        );
        return NextResponse.json(
          { error: "Voucher not found" },
          { status: 404 }
        );
      }

      // Send payment success email for development mode
      await sendPaymentSuccessEmailIfNeeded([voucher]);

      return NextResponse.json({
        success: true,
        voucher,
        vouchers: [voucher]
      });
    }

    // For production mode, use session_id to find voucher
    if (sessionId) {
      console.log(
        `[Checkout Success] Production mode - processing session: ${sessionId}`
      );

      // Check if Stripe is configured
      if (!process.env.STRIPE_SECRET_KEY) {
        console.error("[Checkout Success] Stripe secret key not configured");
        return NextResponse.json(
          { error: "Stripe not configured" },
          { status: 501 }
        );
      }

      try {
        // Get Stripe session details
        const stripe = await getStripe()
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        console.log("[Checkout Success] Stripe session retrieved:", {
          sessionId,
          customerEmail: session.customer_details?.email,
          metadata: session.metadata,
        });

        if (!session) {
          console.error(
            "[Checkout Success] No Stripe session found for sessionId:",
            sessionId
          );
          return NextResponse.json(
            { error: "Invalid session" },
            { status: 400 }
          );
        }

        // Get customer email from Stripe session
        const customerEmail = session.customer_details?.email;
        if (!customerEmail) {
          console.error(
            "[Checkout Success] No customer email found in Stripe session"
          );
          return NextResponse.json(
            {
              error: "No customer email found in checkout session",
              details: "Please ensure you provided an email during checkout",
            },
            { status: 400 }
          );
        }

        // Check payment status
        const paymentStatus = session.payment_status;
        const giftCount = session.metadata?.gift_count ? parseInt(session.metadata.gift_count) : 1;

        // 1. Try to find existing vouchers (all of them)
        let vouchers = await waitForVouchersWithRetry(
          session.payment_intent as string,
          giftCount,
          5
        );

        // 2. Fallback Creation (If webhook didn't create ANY vouchers yet)
        if (vouchers.length === 0) {
          console.log(
            `[Checkout Success] Found 0 vouchers. Creating ${giftCount} from session data (Local/Fallback mode).`
          );

          // Get basic gift info (used for legacy or as base)
          const { giftItemId, isBulkDashboard, buyerEmail, adminEmails } = session.metadata || {};

          if (!giftItemId) {
            if (sessionId.startsWith("cs_test_")) {
              return NextResponse.json(
                { error: "Test session missing metadata" },
                { status: 400 }
              );
            }
            return NextResponse.json(
              { error: "Missing gift item information in session" },
              { status: 400 }
            );
          }

          const giftItem = await GiftItem.findById(giftItemId);
          if (!giftItem)
            return NextResponse.json(
              { error: "Gift item not found" },
              { status: 404 }
            );

          const amountTotal = (session.amount_total || 0) / 100;
          
          // Total amount includes the service fee if qty > 1
          // We need to extract the base unit amount (price of coffee)
          let unitAmount = amountTotal / giftCount;
          if (giftCount > 1 && session.metadata?.isBulkDashboard === 'true') {
            // Since Total = Base * (1 + SERVICE_FEE_PERCENT)
            // Base = Total / (1 + SERVICE_FEE_PERCENT)
            unitAmount = (amountTotal / (1 + SERVICE_FEE_PERCENT)) / giftCount;
          }

          const createdVouchers = [];

          for (let i = 0; i < giftCount; i++) {
            // Determine metadata source: Bulk (gift_i) or Legacy (root)
            let giftData: any = {};
            if (session.metadata?.[`gift_${i}`]) {
              try {
                giftData = JSON.parse(session.metadata[`gift_${i}`]);
              } catch (e) {
                console.error(`Error parsing gift_${i}`, e);
              }
            } else {
              // Fallback to root metadata (mostly for single gift backward compat)
              giftData = {
                recipientName: session.metadata?.recipientName,
                senderName: session.metadata?.senderName,
                message: session.metadata?.message,
                isOrganization: session.metadata?.isOrganization,
                organizationId: session.metadata?.organizationId,
                messageCardId: session.metadata?.messageCardId,
              };
            }

            const redemptionCode = nanoid(10);
            const redemptionLink = redemptionCode;

            // Convert organizationId
            let parsedOrganizationId: mongoose.Types.ObjectId | null = null;
            if (
              giftData.organizationId &&
              mongoose.Types.ObjectId.isValid(giftData.organizationId)
            ) {
              parsedOrganizationId = new mongoose.Types.ObjectId(
                giftData.organizationId
              );
            }

            let voucherStatus = "pending";
            if (paymentStatus === "paid") voucherStatus = "issued";

            try {
              const newVoucher = await Voucher.create({
                redemptionCode,
                giftItemId: giftItem._id,
                messageCardId: giftData.messageCardId || "", // Use giftData for messageCardId
                isOrganization:
                  giftData.isOrganization === "true"
                    ? true
                    : giftData.isOrganization === "false"
                      ? false
                      : Boolean(giftData.isOrganization), // Use giftData for isOrganization
                organizationId: parsedOrganizationId,
                status: voucherStatus,
                expiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000), // 5 years from now
                senderName: giftData.senderName || "Anonymous", // Use giftData for senderName
                recipientName: giftData.recipientName || "", // Use giftData for recipientName
                email: customerEmail, // Store customer email
                redemptionLink,
                validLocationIds: giftItem.locationIds, // Use locationIds directly as ObjectIds
                paymentIntentId: session.payment_intent,
                stripeSessionId: sessionId, // Also store session ID for future reference
                message: giftData.message || "", // Use giftData for message
                amount: unitAmount, // Use unitAmount for individual vouchers
                createdAt: new Date(),
              });
              createdVouchers.push(newVoucher);
            } catch (duplicateError) {
              // If there's still a duplicate key error, just log it.
              console.log(
                "[Checkout Success] Duplicate detected during fallback creation:",
                duplicateError instanceof Error
                  ? duplicateError.message
                  : "Unknown error"
              );
            }
          }
          // After attempting to create all, re-fetch to ensure we have all
          vouchers = await Voucher.find({
            paymentIntentId: session.payment_intent,
          });

          // Bulk Dashboard Logic
          if (session.metadata?.isBulkDashboard === 'true') {
            if (session.metadata.magicLinkToken) {
              console.log(`[Checkout Success] Processing Top-Up for Magic Dashboard: ${session.metadata.magicLinkToken}`);

              const existingDashboard = await BulkDashboard.findOne({ magicLinkToken: session.metadata.magicLinkToken });

              if (existingDashboard) {
                // Link all created vouchers to this EXISTING dashboard
                await Voucher.updateMany(
                  { paymentIntentId: session.payment_intent },
                  { $set: { bulkDashboardId: existingDashboard._id } }
                );
                console.log(`[Checkout Success] successfully attached ${vouchers.length} vouchers to existing dashboard ${existingDashboard._id}`);
              }
            } else {
              console.log(`[Checkout Success] Creating NEW Bulk Dashboard for ${session.metadata.buyerEmail || customerEmail}`);

              const magicLinkToken = nanoid(32); // Secure token for magic link
              let parsedAdmins: string[] = [];

              if (session.metadata.adminEmails) {
                try {
                  parsedAdmins = JSON.parse(session.metadata.adminEmails);
                } catch (e) {
                  console.error("Failed to parse admin emails", e);
                }
              }

              const newDashboard = await BulkDashboard.create({
                ownerEmail: session.metadata?.buyerEmail || customerEmail,
                magicLinkToken,
                admins: parsedAdmins,
                defaultSenderName: session.metadata?.senderName || session.metadata?.buyerEmail || customerEmail,
                defaultMessage: session.metadata?.message || "Enjoy a coffee on us!",
              });

              // Link all created vouchers to this NEW dashboard
              await Voucher.updateMany(
                { paymentIntentId: session.payment_intent },
                { $set: { bulkDashboardId: newDashboard._id } }
              );

              // Send Bulk Dashboard email INSTEAD of 20 separate gift emails
              if (session.metadata.buyerEmail || customerEmail) {
                // Check if bulk email was already sent
                const updateResult = await Voucher.updateMany(
                  { paymentIntentId: session.payment_intent, isEmailSent: { $ne: true } },
                  { $set: { isEmailSent: true } }
                );

                if (updateResult.modifiedCount > 0) {
                  await sendBulkDashboardEmail(
                    session.metadata.buyerEmail || customerEmail || '',
                    magicLinkToken,
                    vouchers,
                    giftItem,
                    giftCount
                  );
                } else {
                  console.log("[Checkout Success] Bulk email already sent by webhook or previous request. Skipping duplicate.");
                }
              }
            }
          }
        }

        // Re-populate if needed (if created above, it might not be populated)
        if (vouchers.length > 0) {
          // Populate all
          vouchers = await Promise.all(
            vouchers.map(async (v) => {
              return Voucher.findById(v._id)
                .populate({
                  path: "giftItemId",
                  populate: { path: "merchantId", select: "name" },
                })
                .populate("organizationId");
            })
          );
        }

        if (vouchers.length === 0) {
          console.error(
            "[Checkout Success] Failed to create or find voucher after all attempts"
          );
          return NextResponse.json(
            { error: "Failed to create or find voucher" },
            { status: 500 }
          );
        }

        // Check if this was a bulk dashboard purchase (webhook completed it)
        let isBulkDashboard = false;
        let magicLinkToken = null;
        let dashboardId = null;

        if (session.metadata?.isBulkDashboard === 'true') {
          isBulkDashboard = true;
          // Retrieve the token from the associated BulkDashboard
          const firstVoucherInfo = await Voucher.findById(vouchers[0]._id).select('bulkDashboardId');
          if (firstVoucherInfo?.bulkDashboardId) {
            const dashboard = await BulkDashboard.findById(firstVoucherInfo.bulkDashboardId);
            if (dashboard) {
              magicLinkToken = dashboard.magicLinkToken;
              dashboardId = dashboard._id;
            }
          }
        }

        // Send payment success email ONLY if it's not a bulk dashboard purchase
        // (Bulk dashboard emails are handled by the webhook or creation fallback)
        if (!isBulkDashboard) {
          const voucherIds = vouchers.map(v => v._id);
          const updateResult = await Voucher.updateMany(
            { _id: { $in: voucherIds }, isEmailSent: { $ne: true } },
            { $set: { isEmailSent: true } }
          );

          if (updateResult.modifiedCount > 0) {
            await sendPaymentSuccessEmailIfNeeded(
              vouchers,
              customerEmail || undefined
            );
          } else {
            console.log("[Checkout Success] Standard email already sent by webhook or previous request. Skipping duplicate.");
          }
        }

        console.log("[Checkout Success] Success response prepared");
        return NextResponse.json({
          success: true,
          voucher: vouchers[0], // Backward compatibility
          vouchers: vouchers,
          isBulkDashboard,
          magicLinkToken,
          dashboardId,
        });

      } catch (stripeError) {
        console.error("[Checkout Success] Stripe API error:", stripeError);
        return NextResponse.json(
          { error: "Failed to retrieve payment session" },
          { status: 500 }
        );
      }
    }

    console.error("[Checkout Success] Missing required parameters");
    return NextResponse.json(
      { error: "Missing voucher_id or session_id parameter" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[Checkout Success] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
