import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import BulkDashboard from "@/models/BulkDashboard";
import Voucher from "@/models/Voucher";
import "@/models/GiftItem";
import "@/models/Merchant";

export async function GET(
    request: NextRequest,
    { params }: { params: { token: string } }
) {
    try {
        await connectToDatabase();

        const { token } = params;

        if (!token) {
            return NextResponse.json({ error: "Token is required" }, { status: 400 });
        }

        // Find the dashboard by its magic link token
        const dashboard = await BulkDashboard.findOne({ magicLinkToken: token });

        if (!dashboard) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
        }

        // Fetch all vouchers connected to this dashboard
        const vouchers = await Voucher.find({ bulkDashboardId: dashboard._id }).populate({
            path: "giftItemId",
            populate: { path: "merchantId", select: "name" },
        });

        return NextResponse.json({
            success: true,
            dashboard,
            vouchers
        });
    } catch (err) {
        console.error("Dashboard fetch error:", err);
        return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { token: string } }
) {
    try {
        await connectToDatabase();
        const { token } = params;
        const body = await request.json();
        const { defaultSenderName, defaultMessage, applyToAll } = body;

        const updatedDashboard = await BulkDashboard.findOneAndUpdate(
            { magicLinkToken: token },
            { $set: { defaultSenderName, defaultMessage } },
            { new: true }
        );

        if (!updatedDashboard) {
            return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
        }

        // If applyToAll is true, update all vouchers associated with this dashboard that haven't been sent yet
        if (applyToAll) {
            await Voucher.updateMany(
                {
                    bulkDashboardId: updatedDashboard._id,
                    sentAt: { $exists: false } // Only unsent vouchers
                },
                {
                    $set: {
                        senderName: defaultSenderName,
                        message: defaultMessage
                    }
                }
            );
        }

        return NextResponse.json({ success: true, dashboard: updatedDashboard });
    } catch (err) {
        console.error("Dashboard update error:", err);
        return NextResponse.json({ error: "Failed to update dashboard" }, { status: 500 });
    }
}
