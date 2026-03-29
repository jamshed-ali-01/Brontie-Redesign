import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import BulkDashboard from "@/models/BulkDashboard";
import Voucher from "@/models/Voucher";

export async function PATCH(
    request: NextRequest,
    { params }: { params: { token: string; voucherId: string } }
) {
    try {
        await connectToDatabase();
        const { token, voucherId } = params;
        const body = await request.json();
        const { senderName, message } = body;

        // Verify dashboard exists
        const dashboard = await BulkDashboard.findOne({ magicLinkToken: token });
        if (!dashboard) {
            return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
        }

        // Update the specific voucher, ensuring it belongs to this dashboard
        const updatedVoucher = await Voucher.findOneAndUpdate(
            { _id: voucherId, bulkDashboardId: dashboard._id },
            { $set: { senderName, message } },
            { new: true }
        );

        if (!updatedVoucher) {
            return NextResponse.json({ error: "Voucher not found or access denied" }, { status: 404 });
        }

        return NextResponse.json({ success: true, voucher: updatedVoucher });
    } catch (err) {
        console.error("Voucher update error:", err);
        return NextResponse.json({ error: "Failed to update voucher" }, { status: 500 });
    }
}
