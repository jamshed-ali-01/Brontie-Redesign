// src/app/api/organizations/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "@/lib/mongodb";
import Voucher from "@/models/Voucher";
import Organization from "@/models/Organization";
import Merchant from "@/models/Merchant";

export async function GET(request: NextRequest) {
  try {
    // 1. Read token from cookie
    const token = request.cookies.get("org-token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // 2. Decode JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret");
    } catch (err) {
      console.error("JWT verify failed:", err);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Extract organization ID
    const organizationId =
      decoded.organizationId || decoded.orgId || decoded.id;

    if (!organizationId || !/^[0-9a-fA-F]{24}$/.test(String(organizationId))) {
      return NextResponse.json(
        { error: "Invalid organization id" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const orgObjectId = new mongoose.Types.ObjectId(organizationId);

    const merchants = await Merchant.find({}).select("name").limit(200).lean();
    console.log(merchants)

    // 3. Aggregation pipeline: counts + vouchers
    const pipeline = [
      { $match: { organizationId: orgObjectId } },

      {
        $facet: {
          counts: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                redeemed: {
                  $sum: { $cond: [{ $eq: ["$status", "redeemed"] }, 1, 0] },
                },
                active: {
                  $sum: {
                    $cond: [
                      { $in: ["$status", ["issued", "pending", "unredeemed"]] },
                      1,
                      0,
                    ],
                  },
                },
                redeemedValue: {
                  $sum: {
                    $cond: [
                      { $eq: ["$status", "redeemed"] },
                      { $ifNull: ["$amount", 0] },
                      0,
                    ],
                  },
                },
              },
            },
            { $project: { _id: 0 } },
          ],

          vouchers: [
            {
              $match: {
                $or: [
                  { status: "redeemed" },
                  { status: "issued" },
                  { status: "pending" },
                  { status: "unredeemed" },
                ],
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 500 },
            {
              $lookup: {
                from: "giftitems",
                localField: "giftItemId",
                foreignField: "_id",
                as: "giftItem",
              },
            },
            {
              $unwind: { path: "$giftItem", preserveNullAndEmptyArrays: true },
            },
            {
              $project: {
                _id: 1,
                status: 1,
                createdAt: 1,
                redeemedAt: 1,
                amount: 1,
                redemptionLink: 1,
                senderName: 1,
                recipientName: 1,
                recipientEmail: 1,
                message: 1,
                giftItem: {
                  name: "$giftItem.name",
                  price: "$giftItem.price",
                  imageUrl: "$giftItem.imageUrl",
                },
              },
            },
          ],
        },
      },

      {
        $project: {
          counts: { $arrayElemAt: ["$counts", 0] },
          vouchers: 1,
        },
      },
    ];

    const result = await Voucher.aggregate(pipeline as any[]);
    const counts = result[0].counts || {
      total: 0,
      redeemed: 0,
      active: 0,
      redeemedValue: 0,
    };

    // Also fetch organization basic info
    const organization = await Organization.findById(orgObjectId)
      .select("name email logoUrl favoriteMerchantId qrImageUrl slug")
      .lean();

    return NextResponse.json({
      counts,
      vouchers: result[0].vouchers || [],
      organization,
      redeemedValue: counts.redeemedValue || 0,
      merchants
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
