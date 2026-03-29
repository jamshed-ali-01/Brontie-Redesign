// src/app/api/admin/reset-redeemed-period/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import RedeemedPeriodReset from "@/models/RedeemedPeriodReset";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    
    await connectToDatabase();

    const { merchantId, notes } = await request.json();

    if (!merchantId) {
      return NextResponse.json({ error: "Merchant ID is required" }, { status: 400 });
    }

    // Create new reset record
    const resetRecord = new RedeemedPeriodReset({
      merchantId: merchantId,
      resetBy: 'admin',
      notes: notes || 'Manual reset by admin'
    });

    await resetRecord.save();

    return NextResponse.json({
      success: true,
      message: "Redeemed period reset successfully",
      merchantId: merchantId,
      resetRecord: {
        id: resetRecord._id,
        resetAt: resetRecord.resetAt
      }
    });

  } catch (error) {
    console.error("Reset redeemed period error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get reset history for a merchant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');

    if (!merchantId) {
      return NextResponse.json({ error: "Merchant ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    const resetHistory = await RedeemedPeriodReset.find({ merchantId })
      .sort({ resetAt: -1 })
      .limit(10);

    return NextResponse.json({
      success: true,
      data: resetHistory
    });

  } catch (error) {
    console.error("Get reset history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}