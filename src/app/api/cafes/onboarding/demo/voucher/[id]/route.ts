import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import MerchantDemo from "@/models/MerchantDemo";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    // Find the demo voucher by full ID or short suffix
    let demo;
    if (id.length === 24) {
      demo = await MerchantDemo.findById(id);
    } else {
      // Find by suffix if the ID is shortened (e.g. 8 characters)
      // We use $expr and $toString because $regex doesn't work directly on ObjectIds
      demo = await MerchantDemo.findOne({
        $expr: {
          $regexMatch: {
            input: { $toString: "$_id" },
            regex: `${id}$`
          }
        }
      });
    }

    if (!demo) {
      return NextResponse.json({ success: false, error: "Demo voucher not found" }, { status: 404 });
    }

    // Mock the production data structure exactly
    return NextResponse.json({
      success: true,
      voucher: {
        _id: demo._id,
        status: demo.status,
        recipientName: "Demo User",
        senderName: "Brontie Demo",
        message: "This is a demo voucher message. It helps you see how the real thing looks!",
        senderMessage: "Experience the magic of Brontie.",
        redemptionLink: demo._id,
        createdAt: demo.createdAt,
        redeemedAt: demo.status === 'redeemed' ? new Date().toISOString() : null,
        giftItemId: {
           name: demo.itemName || "Demo Coffee",
           price: 4.50,
           imageUrl: demo.itemImage || "https://images.unsplash.com/photo-1541167760496-162955ed8a9f?q=80&w=600&auto=format&fit=crop",
           description: "A perfect demo coffee to show you how easy it is to redeem rewards with Brontie.",
           merchantId: {
              name: "Your Awesome Cafe",
              logoUrl: "/images/pngs/logo.png"
           }
        },
        messageCardId: null, // Demo doesn't use message cards yet
        validLocationIds: ["demo-loc-1"],
        recipientToken: "demo-token",
      },
      locations: [
        {
          _id: "demo-loc-1",
          name: "Main Street Branch (Demo)",
          address: "123 Demo Road, Dublin",
          merchantId: "demo-merchant"
        }
      ],
    });
  } catch (error) {
    console.error("[Demo Voucher API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
