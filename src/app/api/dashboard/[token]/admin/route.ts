import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import BulkDashboard from "@/models/BulkDashboard";
import Voucher from "@/models/Voucher";
import GiftItem from "@/models/GiftItem";
import { sendBulkDashboardEmail } from "@/lib/email";

export async function POST(
    request: NextRequest,
    { params }: { params: { token: string } }
) {
    try {
        await connectToDatabase();

        const { token } = params;
        const body = await request.json();
        const { email } = body;

        if (!token) {
            return NextResponse.json({ error: "Token is required" }, { status: 400 });
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
        }

        // Find the dashboard by its magic link token
        const dashboard = await BulkDashboard.findOne({ magicLinkToken: token });

        if (!dashboard) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
        }

        // Check if email is already the owner or an admin
        if (dashboard.ownerEmail.toLowerCase() === email.toLowerCase()) {
            return NextResponse.json({ error: "This email is already the owner" }, { status: 400 });
        }

        if (dashboard.admins && dashboard.admins.some((admin: string) => admin.toLowerCase() === email.toLowerCase())) {
            return NextResponse.json({ error: "This email is already an admin" }, { status: 400 });
        }

        // Add to admins array
        dashboard.admins = dashboard.admins || [];
        dashboard.admins.push(email);
        await dashboard.save();

        // Send email to new admin
        try {
            const vouchers = await Voucher.find({ bulkDashboardId: dashboard._id });
            if (vouchers.length > 0) {
                const sampleVoucher = vouchers[0];
                const giftItem = await GiftItem.findById(sampleVoucher.giftItemId).populate('merchantId');
                
                if (giftItem) {
                    await sendBulkDashboardEmail(
                        email,
                        token,
                        vouchers,
                        giftItem,
                        vouchers.length
                    );
                }
            }
        } catch (emailErr) {
            console.error("Failed to send dashboard email to new admin:", emailErr);
            // Non-blocking error
        }

        return NextResponse.json({
            success: true,
            message: "Admin successfully added",
            admins: dashboard.admins
        });
    } catch (err) {
        console.error("Dashboard admin add error:", err);
        return NextResponse.json({ error: "Failed to add admin" }, { status: 500 });
    }
}
