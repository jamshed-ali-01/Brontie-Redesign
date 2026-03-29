import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";
import PayoutItem from "@/models/PayoutItem";
import GiftItem from "@/models/GiftItem";
import Voucher from "@/models/Voucher";

export async function POST(request: NextRequest) {
  try {
    const { merchantId, paidUpToDate } = await request.json();

    if (!merchantId || !paidUpToDate) {
      return NextResponse.json(
        { error: "Missing merchantId or paidUpToDate" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const merchantObjectId = new mongoose.Types.ObjectId(merchantId);
    const cutoffDate = new Date(paidUpToDate);

    // 1️⃣ Fetch ALL GiftItems owned by this merchant
    const giftItems = await GiftItem.find(
      { merchantId: merchantObjectId },
      { _id: 1 }
    );

    if (giftItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Merchant has no gift items",
        markedAsPaid: 0,
      });
    }

    const giftItemIds = giftItems.map((g) => g._id);

    // 2️⃣ Fetch ALL vouchers for these gift items
    const vouchers = await Voucher.find(
      {
        giftItemId: { $in: giftItemIds },
      },
      { _id: 1 }
    );

    if (vouchers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No vouchers found for this merchant",
        markedAsPaid: 0,
      });
    }

    const voucherIds = vouchers.map((v) => v._id);

    // 3️⃣ Fetch payout items linked ONLY to these vouchers
    const pendingItems = await PayoutItem.find({
      voucherId: { $in: voucherIds },
      status: "pending",
      createdAt: { $lte: cutoffDate },
    });

    if (pendingItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No pending payouts found up to selected date",
        markedAsPaid: 0,
      });
    }

    // 4️⃣ Mark all these payouts as PAID
    const result = await PayoutItem.updateMany(
      {
        voucherId: { $in: voucherIds },
        status: "pending",
        createdAt: { $lte: cutoffDate },
      },
      {
        status: "paid",
        paidOutAt: new Date(),
        paymentMethod: "manual_bank_transfer",
        notes: `Marked as paid manually up to ${cutoffDate.toISOString().split("T")[0]}`,
      }
    );

    return NextResponse.json({
      success: true,
      message: `Successfully marked ${result.modifiedCount} payout items as PAID`,
      markedAsPaid: result.modifiedCount,
      cutoffDate: cutoffDate.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("Error marking payouts as paid:", error);
    return NextResponse.json(
      { error: "Failed to mark payouts as paid" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                            GET — SUMMARY API                               */
/* -------------------------------------------------------------------------- */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get("merchantId");

    if (!merchantId) {
      return NextResponse.json(
        { error: "Missing merchantId" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const merchantObjectId = new mongoose.Types.ObjectId(merchantId);

    const summary = await PayoutItem.aggregate([
      { $match: { merchantId: merchantObjectId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amountPayable" },
          latestDate: { $max: "$createdAt" },
        },
      },
    ]);

    const recentItems = await PayoutItem.find({
      merchantId: merchantObjectId,
    })
      .populate("voucherId")
      .sort({ createdAt: -1 })
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        summary,
        recentItems: recentItems.map((item) => ({
          id: item._id,
          voucherId: item.voucherId,
          amountPayable: item.amountPayable,
          status: item.status,
          createdAt: item.createdAt,
          paidOutAt: item.paidOutAt,
          paymentMethod: item.paymentMethod,
          notes: item.notes,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching payout summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch payout summary" },
      { status: 500 }
    );
  }
}
