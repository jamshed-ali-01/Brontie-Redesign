import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import BulkDashboard from "@/models/BulkDashboard";
import Voucher from "@/models/Voucher";
import { sendPaymentSuccessEmail } from "@/lib/email";

export async function POST(
    request: NextRequest,
    { params }: { params: { token: string } }
) {
    try {
        await connectToDatabase();

        const { token } = params;

        if (!token) {
            return NextResponse.json({ error: "Token is required" }, { status: 400 });
        }

        const dashboard = await BulkDashboard.findOne({ magicLinkToken: token });

        if (!dashboard) {
            return NextResponse.json({ error: "Invalid token" }, { status: 404 });
        }

        const { voucherId, recipientEmail, recipientName, message } = await request.json();

        if (!voucherId || !recipientEmail) {
            return NextResponse.json({ error: "Voucher ID and Recipient Email are required" }, { status: 400 });
        }

        // Verify voucher belongs to this dashboard
        const voucher = await Voucher.findOne({ _id: voucherId, bulkDashboardId: dashboard._id }).populate({
            path: 'giftItemId',
            populate: { path: 'merchantId', select: 'name' }
        });

        if (!voucher) {
            return NextResponse.json({ error: "Voucher not found or access denied" }, { status: 404 });
        }

        if (voucher.sentAt) {
            return NextResponse.json({ error: "Voucher has already been sent" }, { status: 400 });
        }

        // Mark as sent and update details
        voucher.recipientEmail = recipientEmail;
        voucher.recipientName = recipientName || "Colleague";
        voucher.message = message || "";
        voucher.sentAt = new Date();

        await voucher.save();

        // Send the email directly to the recipient
        await sendPaymentSuccessEmail(recipientEmail, [{
            giftItemId: {
                name: voucher.giftItemId.name,
                price: voucher.giftItemId.price,
                merchantId: { name: voucher.giftItemId.merchantId.name },
            },
            senderName: dashboard.ownerEmail, // Use owner email for now, ideally want a real name!
            recipientName: voucher.recipientName,
            redemptionLink: voucher.redemptionLink,
            status: voucher.status,
        }]);

        return NextResponse.json({
            success: true,
            voucher
        });
    } catch (err) {
        console.error("Voucher send error:", err);
        return NextResponse.json({ error: "Failed to send voucher" }, { status: 500 });
    }
}
