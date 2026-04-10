// src\app\api\cafes\dashboard\route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Voucher from "@/models/Voucher";
import Merchant from "@/models/Merchant";
import PayoutItem from "@/models/PayoutItem";
import RedeemedPeriodReset from "@/models/RedeemedPeriodReset"; // Naya model import
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Helper function to get next payout date (2nd and 4th Friday)
function getNextPayoutDate(): string {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 5 = Friday

  // Find next Friday
  let daysUntilFriday = 5 - currentDay;
  if (daysUntilFriday <= 0) daysUntilFriday += 7;

  const nextFriday = new Date(today);
  nextFriday.setDate(today.getDate() + daysUntilFriday);

  // Check if it's 2nd or 4th Friday of the month
  const weekOfMonth = Math.ceil((nextFriday.getDate() - 1) / 7);

  if (weekOfMonth === 2 || weekOfMonth === 4) {
    return nextFriday.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }

  // Find the next 2nd or 4th Friday
  let targetWeek = weekOfMonth < 2 ? 2 : 4;
  if (weekOfMonth > 4) {
    targetWeek = 2;
    nextFriday.setMonth(nextFriday.getMonth() + 1);
  }

  const targetDate = new Date(nextFriday);
  targetDate.setDate(1 + (targetWeek - 1) * 7);

  // Adjust to Friday
  while (targetDate.getDay() !== 5) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  return targetDate.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export async function GET(request: NextRequest) {
  try {
    // Get merchant ID from JWT token
    const token = request.cookies.get("cafe-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret"
    ) as { merchantId: string };
    const merchantId = decoded.merchantId;

    if (!merchantId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    console.log("Dashboard API - Merchant ID:", merchantId);
    console.log("Dashboard API - Merchant ID type:", typeof merchantId);
    console.log("Dashboard API - Merchant ID length:", merchantId?.length);
    console.log("Dashboard API - Token decoded:", decoded);

    // Check if merchantId is a valid MongoDB ObjectId format
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(merchantId)) {
      console.log("Dashboard API - Invalid ObjectId format:", merchantId);
      return NextResponse.json(
        { error: "Invalid merchant ID format" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Convert merchantId to ObjectId
    const merchantObjectId = new mongoose.Types.ObjectId(merchantId);

    // Debug: Check if there are any merchants in the database
    const allMerchants = await Merchant.find({})
      .select("_id name contactEmail status")
      .limit(5);
    console.log(
      "Dashboard API - All merchants in DB:",
      allMerchants.map((m) => ({
        id: m._id,
        name: m.name,
        email: m.contactEmail,
        status: m.status,
      }))
    );
    console.log(
      "Dashboard API - Looking for merchant with ObjectId:",
      merchantObjectId
    );

    // Get date range for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Enforce minimum start date: Sep 26, 2025 08:16 AM UTC
    const MIN_START_ISO = "2025-09-26T08:16:00.000Z";
    const minStartDate = new Date(MIN_START_ISO);
    const amountExpr = { $ifNull: ["$amount", { $ifNull: ["$amountGross", "$giftItem.price"] }] };
    const effectiveStartDate = new Date(
      Math.max(thirtyDaysAgo.getTime(), minStartDate.getTime())
    );

    // const MIN_START_ISO = "2025-09-26T08:16:00.000Z";
    const dateFrom = new Date(MIN_START_ISO);

    // ========== REDEEMED PERIOD RESET LOGIC ==========
    // Get the latest reset date for this merchant
    const latestReset = await RedeemedPeriodReset.findOne({
      merchantId: merchantObjectId
    }).sort({ resetAt: -1 });

    // Use reset date if available, otherwise use default start date
    const redeemedStartDate = latestReset ?
      new Date(latestReset.resetAt) :
      new Date(MIN_START_ISO);

    console.log("Redeemed period calculation:", {
      resetDate: redeemedStartDate,
      hasReset: !!latestReset,
      resetRecordId: latestReset?._id
    });
    // ========== END REDEEMED PERIOD RESET LOGIC ==========

    // Get active vouchers (unredeemed, valid)
    const activeVouchers = await Voucher.aggregate([
      {
        $lookup: {
          from: "giftitems",
          localField: "giftItemId",
          foreignField: "_id",
          as: "giftItem",
        },
      },
      {
        $unwind: "$giftItem",
      },
      {
        $match: {
          "giftItem.merchantId": merchantObjectId,
          status: { $in: ["issued", "pending", "unredeemed"] },
          createdAt: { $gte: minStartDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          totalValue: { $sum: amountExpr }, // YEH KARO
        },
      },
    ]);

    // Debug: Check sample active vouchers with their merchant IDs
    const sampleActiveVouchers = await Voucher.aggregate([
      {
        $lookup: {
          from: "giftitems",
          localField: "giftItemId",
          foreignField: "_id",
          as: "giftItem",
        },
      },
      {
        $unwind: "$giftItem",
      },
      {
        $match: {
          status: { $in: ["issued", "pending", "unredeemed"] },
          createdAt: { $gte: minStartDate },
        },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          _id: 1,
          status: 1,
          "giftItem._id": 1,
          "giftItem.name": 1,
          "giftItem.merchantId": 1,
        },
      },
    ]);
    console.log(
      "Dashboard API - Sample active vouchers for debugging:",
      JSON.stringify(sampleActiveVouchers, null, 2)
    );
    console.log(
      "Dashboard API - Looking for merchantObjectId:",
      merchantObjectId.toString()
    );

    // Get top selling items from active vouchers (alternative calculation)
    const topSellingFromActiveVouchers = await Voucher.aggregate([
      {
        $lookup: {
          from: "giftitems",
          localField: "giftItemId",
          foreignField: "_id",
          as: "giftItem",
        },
      },
      {
        $unwind: "$giftItem",
      },
      {
        $match: {
          "giftItem.merchantId": merchantObjectId,
          status: { $in: ["issued", "pending", "unredeemed"] },
          createdAt: { $gte: minStartDate },
        },
      },
      {
        $group: {
          _id: "$giftItemId",
          name: { $first: "$giftItem.name" },
          sales: { $sum: 1 },
          revenue: { $sum: amountExpr },
        },
      },
      {
        $sort: { sales: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    // Get redeemed vouchers - ONLY AFTER RESET DATE
    const redeemedVouchers = await Voucher.aggregate([
      {
        $lookup: {
          from: "giftitems",
          localField: "giftItemId",
          foreignField: "_id",
          as: "giftItem",
        },
      },
      {
        $unwind: "$giftItem",
      },
      {
        $match: {
          "giftItem.merchantId": merchantObjectId,
          status: "redeemed",
          // YEH IMPORTANT CHANGE HAI - reset date ke baad wale redeemed vouchers
          redeemedAt: { $gte: redeemedStartDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          totalValue: { $sum: amountExpr }, // YEH KARO
        },
      },
    ]);

    // Get actually paid out amounts from PayoutItem collection
    const paidOutAmounts = await PayoutItem.aggregate([
      {
        $match: {
          merchantId: merchantObjectId,
          status: "paid",
          paidOutAt: { $gte: minStartDate },
        },
      },
      {
        $group: {
          _id: null,
          totalPaidOut: { $sum: "$amountPayable" },
          totalCount: { $sum: 1 },
        },
      },
    ]);

    // =====new cal===============
    const availableBalanceAgg = await PayoutItem.aggregate([
      { $match: { status: "pending", merchantId: merchantObjectId } },
      {
        $lookup: {
          from: "vouchers",
          localField: "voucherId",
          foreignField: "_id",
          as: "voucher",
        },
      },
      { $unwind: "$voucher" },
      {
        $match: {
          $or: [
            { "voucher.redeemedAt": { $exists: true, $gte: dateFrom } },
            { "voucher.createdAt": { $exists: true, $gte: dateFrom } },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amountPayable" },
          count: { $sum: 1 },
        },
      },
    ]);

    console.log("Available Balance Aggregation Result:", availableBalanceAgg);
    const availableBalance = availableBalanceAgg[0]?.totalAmount || 0;
    // =======new cal end=============

    // Get top selling items (last 30 days) - based on vouchers (active + redeemed)
    const topSellingItems = await Voucher.aggregate([
      {
        $lookup: {
          from: "giftitems",
          localField: "giftItemId",
          foreignField: "_id",
          as: "giftItem",
        },
      },
      {
        $unwind: "$giftItem",
      },
      {
        $match: {
          "giftItem.merchantId": merchantObjectId,
          status: { $in: ["issued", "pending", "unredeemed", "redeemed"] },
          createdAt: { $gte: minStartDate },
        },
      },
      {
        $group: {
          _id: "$giftItemId",
          name: { $first: "$giftItem.name" },
          sales: { $sum: 1 },
          revenue: { $sum: amountExpr },
        },
      },
      {
        $sort: { sales: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    // Calculate revenue based on vouchers (active + redeemed) - this represents actual sales
    const voucherSales = await Voucher.aggregate([
      {
        $lookup: {
          from: "giftitems",
          localField: "giftItemId",
          foreignField: "_id",
          as: "giftItem",
        },
      },
      {
        $unwind: "$giftItem",
      },
      {
        $match: {
          "giftItem.merchantId": merchantObjectId,
          status: { $in: ["issued", "pending", "unredeemed", "redeemed"] },
          createdAt: { $gte: minStartDate },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: amountExpr },
          totalSales: { $sum: 1 },
        },
      },
    ]);

    // Calculate payout (net after fees) using completed transactions
    const completedPurchases = await Transaction.aggregate([
      {
        $match: {
          merchantId: merchantObjectId,
          type: "purchase",
          status: "completed",
          createdAt: { $gte: minStartDate },
        },
      },
      {
        $lookup: {
          from: "vouchers",
          localField: "voucherId",
          foreignField: "_id",
          as: "voucher",
        },
      },
      { $unwind: "$voucher" },
      { $match: { "voucher.createdAt": { $gte: minStartDate } } },
      {
        $lookup: {
          from: "giftitems",
          localField: "giftItemId",
          foreignField: "_id",
          as: "giftItem",
        },
      },
      { $unwind: "$giftItem" },
      {
        $addFields: {
          calculatedStripeFee: {
            $ifNull: [
              "$stripeFee",
              {
                $add: [{ $multiply: ["$amount", 0.02] }, 0.25],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalPayout: { $sum: "$amount" },
          totalStripeFees: { $sum: "$calculatedStripeFee" },
          totalCommission: { $sum: "$brontieCommission" },
        },
      },
    ]);

    const completedRedemptions = await Transaction.aggregate([
      {
        $match: {
          merchantId: merchantObjectId,
          type: "redemption",
          status: "completed",
          createdAt: { $gte: minStartDate },
        },
      },
      {
        $lookup: {
          from: "vouchers",
          localField: "voucherId",
          foreignField: "_id",
          as: "voucher",
        },
      },
      { $unwind: "$voucher" },
      { $match: { "voucher.createdAt": { $gte: minStartDate } } },
      {
        $group: {
          _id: null,
          totalRedeemed: { $sum: "$amount" },
        },
      },
    ]);

    const totalRevenue = voucherSales[0]?.totalRevenue || 0;
    const totalStripeFees = completedPurchases[0]?.totalStripeFees || 0;
    const totalCommission = completedPurchases[0]?.totalCommission || 0;
    const totalRedeemed = completedRedemptions[0]?.totalRedeemed || 0;

    // Get merchant details including Brontie fee settings and Stripe Connect settings
    console.log("Dashboard API - Searching for merchant with ID:", merchantId);
    const merchant = await Merchant.findById(merchantObjectId).select(
      "payoutDetails brontieFeeSettings stripeConnectSettings createdAt name logoUrl"
    );
    console.log("Dashboard API - Merchant found:", !!merchant);

    if (!merchant) {
      console.log("Dashboard API - Merchant not found for ID:", merchantId);
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    // Calculate account age in days
    const accountAge = Math.floor(
      (Date.now() - new Date(merchant.createdAt).getTime()) /
      (1000 * 60 * 60 * 24)
    );

    // If Brontie fee is not active for the merchant, do not deduct commission
    const rawCommissionRate = merchant.brontieFeeSettings?.commissionRate as
      | number
      | undefined;
    const hasCommissionRate =
      typeof rawCommissionRate === "number" &&
      !isNaN(rawCommissionRate) &&
      rawCommissionRate > 0;
    const isBrontieFeeActive = !!(
      merchant.brontieFeeSettings?.isActive && hasCommissionRate
    );
    const commissionRate = hasCommissionRate ? rawCommissionRate! : 0;
    const commissionToDeduct = isBrontieFeeActive ? totalCommission : 0;
    // Available Balance = Revenue - Stripe Fees - Brontie Commission (if active) + Redeemed Amount
    const balance =
      totalRevenue - totalStripeFees - commissionToDeduct + totalRedeemed;
    const payoutEligible = balance >= 5;

    // Get recent purchases (last 7 vouchers created) - this shows actual sales
    const recentPurchases = await Voucher.aggregate([
      {
        $lookup: {
          from: "giftitems",
          localField: "giftItemId",
          foreignField: "_id",
          as: "giftItem",
        },
      },
      {
        $unwind: "$giftItem",
      },
      {
        $match: {
          "giftItem.merchantId": merchantObjectId,
          status: { $in: ["issued", "pending", "unredeemed", "redeemed"] },
          createdAt: { $gte: minStartDate },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $limit: 7,
      },
      {
        $project: {
          date: "$createdAt",
          item: "$giftItem.name",
          value: amountExpr,
          status: "$status",
          sender: { $ifNull: ["$senderName", "Anonymous"] },
          recipient: { $ifNull: ["$recipientName", "Anonymous"] },
        },
      },
    ]);

    // Get recent redemptions (only redeemed vouchers) - this shows actual redemptions
    const recentRedemptions = await Voucher.aggregate([
      {
        $lookup: {
          from: "giftitems",
          localField: "giftItemId",
          foreignField: "_id",
          as: "giftItem",
        },
      },
      {
        $unwind: "$giftItem",
      },
      {
        $match: {
          "giftItem.merchantId": merchantObjectId,
          status: "redeemed",
          // Reset date ke baad wale redeemed vouchers hi show karein
          redeemedAt: { $gte: redeemedStartDate },
        },
      },
      {
        $sort: { redeemedAt: -1 }, // Sort by exact redemption date
      },
      {
        $limit: 7,
      },
      {
        $project: {
          date: "$redeemedAt",
          item: "$giftItem.name",
          value: amountExpr,
          redeemedAt: "$redeemedAt",
        },
      },
    ]);

    // Get daily activity for last 30 days

    // Get daily activity directly from vouchers - more reliable approach
    const voucherBasedActivity = await Voucher.aggregate([
      {
        $lookup: {
          from: "giftitems",
          localField: "giftItemId",
          foreignField: "_id",
          as: "giftItem",
        },
      },
      {
        $unwind: "$giftItem",
      },
      {
        $match: {
          "giftItem.merchantId": merchantObjectId,
          createdAt: { $gte: minStartDate }, // Use minStartDate (26th Sept)
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            status: "$status",
          },
          count: { $sum: 1 },
          totalValue: { $sum: amountExpr },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          activities: {
            $push: {
              type: "$_id.status",
              count: "$count",
              totalValue: "$totalValue",
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Get daily activity for last 30 days - simplified query
    const dailyActivity = await Transaction.aggregate([
      {
        $match: {
          merchantId: merchantObjectId,
          status: "completed",
          createdAt: { $gte: effectiveStartDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            type: "$type",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          activities: {
            $push: {
              type: "$_id.type",
              count: "$count",
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Use voucher-based activity as primary source - more reliable
    const finalActivityData = voucherBasedActivity;

    // Format daily activity data - map voucher statuses correctly
    const formattedDailyActivity = finalActivityData.map(
      (day: {
        _id: string;
        activities: Array<{ type: string; count: number }>;
      }) => {
        // Map voucher statuses to purchased/redeemed
        const purchased = day.activities
          .filter((a) => ["issued", "pending", "unredeemed"].includes(a.type))
          .reduce((sum, a) => sum + a.count, 0);

        const redeemed = day.activities
          .filter((a) => a.type === "redeemed")
          .reduce((sum, a) => sum + a.count, 0);

        return {
          date: day._id,
          purchased,
          redeemed,
        };
      }
    );

    // Fill in missing dates with zeros - last 7 days only
    const completeDailyActivity = [];
    const today = new Date();

    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const existingDay = formattedDailyActivity.find(
        (d) => d.date === dateStr
      );
      completeDailyActivity.push({
        date: dateStr,
        purchased: existingDay?.purchased || 0,
        redeemed: existingDay?.redeemed || 0,
      });
    }

    // Get payout transactions (completed purchases) with automatic Stripe fee calculation
    const payoutTransactions = await Transaction.aggregate([
      {
        $match: {
          merchantId: merchantObjectId,
          type: "purchase",
          status: "completed",
          createdAt: { $gte: minStartDate },
        },
      },
      {
        $lookup: {
          from: "vouchers",
          localField: "voucherId",
          foreignField: "_id",
          as: "voucher",
        },
      },
      { $unwind: "$voucher" },
      { $match: { "voucher.createdAt": { $gte: minStartDate } } },
      {
        $lookup: {
          from: "giftitems",
          localField: "giftItemId",
          foreignField: "_id",
          as: "giftItem",
        },
      },
      {
        $unwind: "$giftItem",
      },
      {
        $addFields: {
          calculatedStripeFee: {
            $ifNull: [
              "$stripeFee",
              {
                $add: [{ $multiply: ["$amount", 0.02] }, 0.25],
              },
            ],
          },
        },
      },
      {
        $project: {
          itemName: "$giftItem.name",
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          grossPrice: "$amount",
          stripeFee: "$calculatedStripeFee", // Use calculated Stripe fee
          netAfterStripe: { $subtract: ["$amount", "$calculatedStripeFee"] },
        },
      },
      {
        $sort: { date: -1 },
      },
    ]);

    // Calculate payout summary
    const grossTotal = payoutTransactions.reduce(
      (sum, t) => sum + t.grossPrice,
      0
    );
    const payoutStripeFees = payoutTransactions.reduce(
      (sum, t) => sum + t.stripeFee,
      0
    );
    const netAfterStripe = grossTotal - payoutStripeFees;

    // Check if brontieFeeSettings exists and is active (post auto-activation)
    const isBrontieFeeActiveNow = isBrontieFeeActive;
    const brontieFee = isBrontieFeeActiveNow
      ? grossTotal * commissionRate
      : 0;
    const availableForPayout = netAfterStripe - brontieFee;

    // Update payoutTransactions to include actual platform fee based on merchant status
    const updatedPayoutTransactions = payoutTransactions.map((transaction) => ({
      ...transaction,
      platformFee: isBrontieFeeActiveNow
        ? transaction.grossPrice * commissionRate
        : 0,
    }));

    // ==========================

    // ---------------------------
    // GET PAID AMOUNT EXACT LIKE TOTALS
    // ---------------------------

    // Same DEFAULT dateFrom validation
    // const MIN_START_ISO = "2025-09-26T08:16:00.000Z";

    let paidDateFrom = '2025-09-26T08:16:00.000Z';


    // Build date filter
    const paidDateFilter: Record<string, unknown> = {};
    if (paidDateFrom) paidDateFilter.$gte = new Date(paidDateFrom);


    // Build PAID PIPELINE (same as totals)
    const paidAmountPipeline: any[] = [
      { $match: { merchantId: merchantObjectId } },
      {
        $lookup: {
          from: "vouchers",
          localField: "voucherId",
          foreignField: "_id",
          as: "voucher",
        },
      },
      { $unwind: "$voucher" },
    ];

    // Apply same date filters as totals
    if (Object.keys(paidDateFilter).length > 0) {
      paidAmountPipeline.push({
        $match: { "voucher.redeemedAt": paidDateFilter },
      });
      paidAmountPipeline.push({
        $match: { "voucher.createdAt": paidDateFilter },
      });
    }

    // Only PAID
    paidAmountPipeline.push({ $match: { status: "paid" } });

    // Group to calculate total amount
    paidAmountPipeline.push({
      $group: {
        _id: null,
        totalAmount: { $sum: "$amountPayable" },
      },
    });

    const paidAmountResult = await PayoutItem.aggregate(paidAmountPipeline);
    const paidAmount = paidAmountResult[0]?.totalAmount || 0;

    console.log("Paid Amount Calculation Result====================== :", paidAmount);

    // ==========================

    const dashboardData = {
      merchantId: merchantId,
      merchantName: merchant?.name || 'Cafe',
      merchantLogo: merchant?.logoUrl || null,
      activeVouchers: activeVouchers[0]?.total || 0,
      activeVouchersValue: activeVouchers[0]?.totalValue || 0,
      redeemedVouchers: redeemedVouchers[0]?.total || 0,
      redeemedVouchersValue: redeemedVouchers[0]?.totalValue || 0,
      paidOutValue: paidAmount || 0,
      // paidOutValue: paidOutAmounts[0]?.totalPaidOut || 0,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      topSellingItems:
        topSellingItems.length > 0
          ? topSellingItems
          : topSellingFromActiveVouchers,
      balance: Math.round(balance * 100) / 100, // Round to 2 decimal places
      nextPayoutDate: getNextPayoutDate(),
      payoutEligible,
      recentRedemptions: recentRedemptions,
      recentPurchases: recentPurchases,
      dailyActivity: completeDailyActivity,
      payoutDetails: merchant?.payoutDetails || {},
      availableForPayout: availableBalance,
      // availableForPayout: Math.round(availableForPayout * 100) / 100,
      payoutTransactions: updatedPayoutTransactions,
      payoutSummary: {
        grossTotal: Math.round(grossTotal * 100) / 100,
        totalStripeFees: Math.round(payoutStripeFees * 100) / 100,
        netAfterStripe: Math.round(netAfterStripe * 100) / 100,
        platformFee: Math.round(brontieFee * 100) / 100,
      },
      brontieFee: {
        isActive: isBrontieFeeActiveNow,
        commissionRate,
        activatedAt: merchant.brontieFeeSettings?.activatedAt || null,
      },
      accountAge,
      stripeConnectSettings: merchant?.stripeConnectSettings || {
        isConnected: false,
        onboardingCompleted: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        payoutSchedule: undefined,
      },
      // Reset information bhi include karein
      redeemedPeriodReset: latestReset ? {
        resetAt: latestReset.resetAt,
        resetBy: latestReset.resetBy,
        notes: latestReset.notes
      } : null
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}