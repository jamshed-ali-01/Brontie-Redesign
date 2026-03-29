import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Voucher from '@/models/Voucher';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const cafeToken = request.cookies.get('cafe-token')?.value;
    let dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Enforce minimum start date: Sep 26, 2025 08:16 AM UTC
    const MIN_START_ISO = '2025-09-26T08:16:00.000Z';
    if (!dateFrom || new Date(dateFrom) < new Date(MIN_START_ISO)) {
      dateFrom = MIN_START_ISO;
    }

    await connectToDatabase();

    // Determine effective merchant from cafe JWT (if present) or query param
    let effectiveMerchantId: string | null = merchantId;
    if (cafeToken) {
      try {
        const decoded = jwt.verify(cafeToken, process.env.JWT_SECRET || 'fallback-secret') as { merchantId: string };
        effectiveMerchantId = decoded.merchantId || null;
      } catch {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
    }

    // Convert merchantId to ObjectId if provided
    const merchantObjectId = effectiveMerchantId ? new (mongoose as any).Types.ObjectId(effectiveMerchantId) : null;

    // Build date filter
    const dateFilter: Record<string, unknown> = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo) dateFilter.$lte = new Date(dateTo);

    // Common lookup/unwind and merchant filter
    const basePipeline: any[] = [
      {
        $lookup: {
          from: 'giftitems',
          localField: 'giftItemId',
          foreignField: '_id',
          as: 'giftItem',
        },
      },
      { $unwind: '$giftItem' },
    ];

    if (merchantObjectId) {
      basePipeline.push({ $match: { 'giftItem.merchantId': merchantObjectId } });
    }

    const amountExpr = { $ifNull: ['$amountGross', '$giftItem.price'] };

    // Sold: created within range (any status)
    const soldPipeline = [
      ...basePipeline,
      ...(Object.keys(dateFilter).length > 0 ? [{ $match: { createdAt: dateFilter } }] : []),
      { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: amountExpr } } }
    ];

    // Redeemed: status redeemed, redeemedAt within range AND createdAt within range
    const redeemedPipeline = [
      ...basePipeline,
      { $match: { status: 'redeemed' } },
      ...(Object.keys(dateFilter).length > 0 ? [
        { $match: { redeemedAt: dateFilter } },
        { $match: { createdAt: dateFilter } }
      ] : []),
      { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: amountExpr } } }
    ];

    // Refunded: status refunded, refundedAt within range AND createdAt within range
    const refundedPipeline = [
      ...basePipeline,
      { $match: { status: 'refunded' } },
      ...(Object.keys(dateFilter).length > 0 ? [
        { $match: { refundedAt: dateFilter } },
        { $match: { createdAt: dateFilter } }
      ] : []),
      { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: amountExpr } } }
    ];

    // Expired: status expired, expiresAt within range AND createdAt within range
    const expiredPipeline = [
      ...basePipeline,
      { $match: { status: 'expired' } },
      ...(Object.keys(dateFilter).length > 0 ? [
        { $match: { expiresAt: dateFilter } },
        { $match: { createdAt: dateFilter } }
      ] : []),
      { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: amountExpr } } }
    ];

    const [soldAgg, redeemedAgg, refundedAgg, expiredAgg] = await Promise.all([
      Voucher.aggregate(soldPipeline),
      Voucher.aggregate(redeemedPipeline),
      Voucher.aggregate(refundedPipeline),
      Voucher.aggregate(expiredPipeline)
    ]);

    const totals = {
      totalSold: {
        count: soldAgg[0]?.count || 0,
        amount: soldAgg[0]?.totalAmount || 0
      },
      totalRedeemed: {
        count: redeemedAgg[0]?.count || 0,
        amount: redeemedAgg[0]?.totalAmount || 0
      },
      totalRefunded: {
        count: refundedAgg[0]?.count || 0,
        amount: refundedAgg[0]?.totalAmount || 0
      },
      totalExpired: {
        count: expiredAgg[0]?.count || 0,
        amount: expiredAgg[0]?.totalAmount || 0
      }
    };

    // Build a status breakdown array consistent with totals
    const statusBreakdown = [
      { _id: 'issued_or_created', count: totals.totalSold.count, totalAmount: totals.totalSold.amount },
      { _id: 'redeemed', count: totals.totalRedeemed.count, totalAmount: totals.totalRedeemed.amount },
      { _id: 'refunded', count: totals.totalRefunded.count, totalAmount: totals.totalRefunded.amount },
      { _id: 'expired', count: totals.totalExpired.count, totalAmount: totals.totalExpired.amount },
    ];

    // Calculate conversion rate
    const conversionRate = totals.totalSold.count > 0 
      ? (totals.totalRedeemed.count / totals.totalSold.count) * 100 
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        totals,
        conversionRate: Math.round(conversionRate * 100) / 100,
        statusBreakdown
      }
    });

  } catch (error) {
    console.error('Error fetching funnel data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch funnel data' },
      { status: 500 }
    );
  }
}
