import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import BulkDashboard from "@/models/BulkDashboard";
import Voucher from "@/models/Voucher";
import { sendGroupedGiftEmail } from "@/lib/email";

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

        const { gifts } = await request.json();

        if (!gifts || !Array.isArray(gifts) || gifts.length === 0) {
            return NextResponse.json({ error: "No valid gifts provided to send" }, { status: 400 });
        }

        let sentCount = 0;
        const failedGifts = [];
        const emailGroups = new Map<string, any[]>();

        for (const gift of gifts) {
            const { voucherId, recipientEmail, recipientName, message, senderName, skipEmail } = gift;

            if (!voucherId) {
                failedGifts.push({ voucherId, error: "Missing ID" });
                continue;
            }

            if (!skipEmail && !recipientEmail) {
                failedGifts.push({ voucherId, error: "Missing Email for delivery" });
                continue;
            }

            // Verify voucher belongs to this dashboard
            const voucher = await Voucher.findOne({ _id: voucherId, bulkDashboardId: dashboard._id }).populate({
                path: 'giftItemId',
                populate: { path: 'merchantId', select: 'name' }
            });

            if (!voucher) {
                failedGifts.push({ voucherId, error: "Voucher not found or access denied" });
                continue;
            }

            if (voucher.sentAt) {
                failedGifts.push({ voucherId, error: "Voucher has already been sent previously" });
                continue;
            }

            // Mark as sent and update details
            voucher.recipientEmail = recipientEmail || "External Share";
            voucher.recipientName = recipientName || "";
            voucher.message = message || "";
            voucher.senderName = senderName || dashboard.defaultSenderName || dashboard.ownerEmail;
            voucher.sentAt = new Date();

            await voucher.save();

            if (skipEmail) {
                sentCount++;
                continue;
            }

            // Group for sending later
            if (!emailGroups.has(recipientEmail)) {
                emailGroups.set(recipientEmail, []);
            }
            emailGroups.get(recipientEmail)!.push(voucher);
        }

        // Now send the grouped emails
        for (const [email, vouchers] of Array.from(emailGroups.entries())) {
            const emailSent = await sendGroupedGiftEmail(email, vouchers.map(v => ({
                giftItemId: {
                    name: v.giftItemId.name,
                    price: v.giftItemId.price,
                    merchantId: { name: v.giftItemId.merchantId.name },
                },
                senderName: v.senderName,
                recipientName: v.recipientName,
                redemptionLink: v.redemptionLink,
                status: v.status,
                message: v.message,
            })), vouchers[0].senderName || "Someone");

            if (emailSent) {
                sentCount += vouchers.length;
            } else {
                for (const v of vouchers) {
                    failedGifts.push({ voucherId: v._id, error: "SMTP Email Delivery Failure" });
                }
            }
        }

        return NextResponse.json({
            success: true,
            sentCount,
            failedGifts,
            totalProcessed: gifts.length
        });

    } catch (err) {
        console.error("Voucher batch send error:", err);
        return NextResponse.json({ error: "Failed to process batch send request" }, { status: 500 });
    }
}
