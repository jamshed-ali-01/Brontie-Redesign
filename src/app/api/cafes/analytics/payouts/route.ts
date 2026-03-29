import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import PayoutItem from "@/models/PayoutItem";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get("merchantId");
    const cafeToken = request.cookies.get("cafe-token")?.value;
    let dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Enforce minimum start date: Sep 26, 2025 08:16 AM UTC
    const MIN_START_ISO = "2025-09-26T08:16:00.000Z";
    if (!dateFrom || new Date(dateFrom) < new Date(MIN_START_ISO)) {
      dateFrom = MIN_START_ISO;
    }

    await connectToDatabase();

    // Determine effective merchant from cafe JWT (if present) or query param
    let effectiveMerchantId: string | null = merchantId;
    if (cafeToken) {
      try {
        const decoded = jwt.verify(
          cafeToken,
          process.env.JWT_SECRET || "fallback-secret"
        ) as { merchantId: string };
        effectiveMerchantId = decoded.merchantId || null;
      } catch {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
    }

    // Convert merchantId to ObjectId if provided
    const merchantObjectId = effectiveMerchantId
      ? new (mongoose as any).Types.ObjectId(effectiveMerchantId)
      : null;

    // Build date filter
    const dateFilter: Record<string, unknown> = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo) dateFilter.$lte = new Date(dateTo);

    // Build match conditions
    const matchConditions: Record<string, unknown> = {};
    if (merchantObjectId) {
      matchConditions.merchantId = merchantObjectId;
    }

    // Get payout data
    const payoutPipeline: any[] = [
      { $match: matchConditions },
      {
        $lookup: {
          from: "vouchers",
          localField: "voucherId",
          foreignField: "_id",
          as: "voucher",
        },
      },
      {
        $unwind: "$voucher",
      },
    ];

    // Add date filter if specified
    if (Object.keys(dateFilter).length > 0) {
      payoutPipeline.push({ $match: { "voucher.redeemedAt": dateFilter } });
      payoutPipeline.push({ $match: { "voucher.createdAt": dateFilter } });
    }

    payoutPipeline.push({
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amountPayable" },
        avgAmount: { $avg: "$amountPayable" },
      },
    });

    const payoutData = await PayoutItem.aggregate(payoutPipeline);

    // Calculate totals
    const totals = {
      pending: { count: 0, amount: 0 },
      paid: { count: 0, amount: 0 },
      reversed: { count: 0, amount: 0 },
      pendingRedemption: { count: 0, amount: 0 },
    };
 


    payoutData.forEach((item) => {
      if (totals[item._id as keyof typeof totals]) {
        totals[item._id as keyof typeof totals].count = item.count;
        totals[item._id as keyof typeof totals].amount = item.totalAmount;
      }
    });

    // Compute vouchers purchased but not redeemed (pending redemption)
    // These are vouchers with status 'issued' or 'pending'
    const pendingRedemptionPipeline: any[] = [
      {
        $lookup: {
          from: "giftitems",
          localField: "giftItemId",
          foreignField: "_id",
          as: "giftItem",
        },
      },
      { $unwind: "$giftItem" },
    ];

    if (merchantObjectId) {
      pendingRedemptionPipeline.push({
        $match: { "giftItem.merchantId": merchantObjectId },
      });
    }

    if (Object.keys(dateFilter).length > 0) {
      pendingRedemptionPipeline.push({
        $match: { createdAt: dateFilter },
      });
    }

    pendingRedemptionPipeline.push({
      $match: { status: { $in: ["issued", "pending"] } },
    });

    pendingRedemptionPipeline.push({
      $group: {
        _id: null,
        count: { $sum: 1 },
        totalAmount: { $sum: { $ifNull: ["$amountGross", "$giftItem.price"] } },
      },
    });

    // Import Voucher lazily to avoid top import changes
    const Voucher = (await import("@/models/Voucher")).default as any;
    const pendingRedemptionAgg = await Voucher.aggregate(
      pendingRedemptionPipeline
    );
    totals.pendingRedemption.count = pendingRedemptionAgg[0]?.count || 0;
    totals.pendingRedemption.amount = pendingRedemptionAgg[0]?.totalAmount || 0;

    // Get recent payouts
    const recentPayoutsPipeline: any[] = [
      { $match: { ...matchConditions, status: "paid" } },
      {
        $lookup: {
          from: "vouchers",
          localField: "voucherId",
          foreignField: "_id",
          as: "voucher",
        },
      },
      {
        $unwind: "$voucher",
      },
      {
        $lookup: {
          from: "merchants",
          localField: "merchantId",
          foreignField: "_id",
          as: "merchant",
        },
      },
      {
        $unwind: "$merchant",
      },
      {
        $sort: { paidOutAt: -1 },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          amountPayable: 1,
          paidOutAt: 1,
          merchantName: "$merchant.name",
          voucherId: 1,
        },
      },
    ];

    const recentPayouts = await PayoutItem.aggregate(recentPayoutsPipeline);

    // Get pending payouts (available payments) grouped by merchant, filtered by voucher.redeemedAt
    const pendingPayoutsPipeline: any[] = [
      { $match: { ...matchConditions, status: "pending" } },
      {
        $lookup: {
          from: "vouchers",
          localField: "voucherId",
          foreignField: "_id",
          as: "voucher",
        },
      },
      { $unwind: "$voucher" },
      // Apply the same date filter window used above, using the voucher's redeemedAt
      ...(Object.keys(dateFilter).length > 0
        ? [
            { $match: { "voucher.redeemedAt": dateFilter } },
            { $match: { "voucher.createdAt": dateFilter } },
          ]
        : []),
      {
        $lookup: {
          from: "merchants",
          localField: "merchantId",
          foreignField: "_id",
          as: "merchant",
        },
      },
      {
        $unwind: "$merchant",
      },
      {
        $group: {
          _id: "$merchantId",
          merchantName: { $first: "$merchant.name" },
          count: { $sum: 1 },
          totalAmount: { $sum: "$amountPayable" },
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
    ];

    const pendingPayouts = await PayoutItem.aggregate(pendingPayoutsPipeline);

    return NextResponse.json({
      success: true,
      data: {
        totals,
        recentPayouts,
        payoutBreakdown: payoutData,
        pendingPayouts,
      },
    });
  } catch (error) {
    console.error("Error fetching payouts data:", error);
    return NextResponse.json(
      { error: "Failed to fetch payouts data" },
      { status: 500 }
    );
  }
}
