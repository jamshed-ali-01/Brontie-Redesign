import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Voucher from "@/models/Voucher";
import GiftItem from "@/models/GiftItem";
import Merchant from "@/models/Merchant";
import MerchantLocation from "@/models/MerchantLocation";
import Category from "@/models/Category";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("[Voucher API] Starting voucher fetch...");

    await connectToDatabase();
    console.log("[Voucher API] Database connected successfully");

    // Ensure all models are registered
    void GiftItem;
    void Merchant;
    void MerchantLocation;
    void Category;

    const { id } = await params;
    console.log(`[Voucher API] Looking for voucher with redemptionLink: ${id}`);

    // Find voucher by redemption link (not ID)
    const voucher = await Voucher.findOne({ redemptionLink: id }).populate({
      path: "giftItemId",
      populate: [
        { path: "merchantId", select: "name logoUrl contactEmail" },
        { path: "locationIds", select: "name address" },
        { path: "categoryId", select: "name slug" },
      ],
    });

    console.log('reedem scan voucher from backend ',voucher)
    if (!voucher) {
      console.log(`[Voucher API] No voucher found for redemptionLink: ${id}`);

      // Let's also check if there are any vouchers at all
      const totalVouchers = await Voucher.countDocuments();
      console.log(`[Voucher API] Total vouchers in database: ${totalVouchers}`);

      // Let's check a few sample vouchers to see what redemptionLinks exist
      const sampleVouchers = await Voucher.find({})
        .select("redemptionLink")
        .limit(5);
      console.log(
        `[Voucher API] Sample voucher redemptionLinks:`,
        sampleVouchers.map((v) => v.redemptionLink)
      );

      return NextResponse.json(
        { success: false, error: "Voucher not found" },
        { status: 404 }
      );
    }

    console.log(`[Voucher API] Voucher found: ${voucher._id}`);

    // Get valid locations for this voucher
    const validLocations = await MerchantLocation.find({
      _id: { $in: voucher.validLocationIds },
    }).select("name address merchantId");

    return NextResponse.json({
      success: true,
      voucher: {
        _id: voucher._id,
        status: voucher.status,
        recipientName: voucher.recipientName,
        senderName: voucher.senderName,
        message: voucher.message,
        senderMessage: voucher.senderMessage,
        redemptionLink: voucher.redemptionLink,
        createdAt: voucher.createdAt,
        redeemedAt: voucher.redeemedAt,
        giftItemId: voucher.giftItemId,
        messageCardId: voucher.messageCardId,
        validLocationIds: voucher.validLocationIds,
        recipientToken: voucher.recipientToken, // line added by farhan
      },
      locations: validLocations,
    });
  } catch (error) {
    console.error("[Voucher API] Error fetching voucher:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
