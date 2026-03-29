import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import BulkDashboard from '@/models/BulkDashboard';
import Voucher from '@/models/Voucher';

// Keep Next.js aware of dynamic nature
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectToDatabase();

        // Find all dashboards
        const dashboards = await BulkDashboard.find().sort({ createdAt: -1 });

        // Enhance with stats
        const enrichedDashboards = await Promise.all(
            dashboards.map(async (dash) => {
                const vouchers = await Voucher.find({ bulkDashboardId: dash._id }).populate({
                    path: "giftItemId",
                    select: "price"
                });

                const totalAmount = vouchers.reduce((acc, v) => acc + (v.giftItemId?.price || v.amount || 0), 0);
                const totalVouchers = vouchers.length;
                const sentVouchers = vouchers.filter(v => v.sentAt || v.status === "redeemed").length;

                return {
                    _id: dash._id,
                    ownerEmail: dash.ownerEmail,
                    magicLinkToken: dash.magicLinkToken,
                    createdAt: dash.createdAt,
                    stats: {
                        totalAmount,
                        totalVouchers,
                        sentVouchers
                    }
                };
            })
        );

        return NextResponse.json({
            success: true,
            dashboards: enrichedDashboards
        });
    } catch (error) {
        console.error('Error fetching bulk buys:', error);
        return NextResponse.json(
            { error: 'Failed to fetch bulk buys' },
            { status: 500 }
        );
    }
}
