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

    // MongoDB aggregation pipeline for product mix
    const pipeline: any[] = [
      {
        $lookup: {
          from: 'giftitems',
          localField: 'giftItemId',
          foreignField: '_id',
          as: 'giftItem',
        },
      },
      {
        $unwind: '$giftItem',
      },
    ];

    // Add merchant filter if specified
    if (merchantObjectId) {
      pipeline.push({
        $match: { 'giftItem.merchantId': merchantObjectId }
      });
    }

    // Only include redeemed vouchers created on/after the min date
    pipeline.push({ $match: { status: 'redeemed' } });
    if (Object.keys(dateFilter).length > 0) {
      pipeline.push({ $match: { createdAt: dateFilter } });
    }

    // Group by product SKU or name
    pipeline.push({
      $group: {
        _id: {
          productSku: { $ifNull: ['$productSku', '$giftItem.name'] },
          productName: '$giftItem.name',
          price: '$giftItem.price'
        },
        count: { $sum: 1 },
        totalRevenue: { $sum: { $ifNull: ['$amountGross', '$giftItem.price'] } },
        avgOrderValue: { $avg: { $ifNull: ['$amountGross', '$giftItem.price'] } }
      }
    });

    // Sort by count descending
    pipeline.push({
      $sort: { count: -1 }
    });

    const productMixData = await Voucher.aggregate(pipeline);

    // Calculate totals
    const totals = productMixData.reduce((acc, product) => ({
      totalCount: acc.totalCount + product.count,
      totalRevenue: acc.totalRevenue + product.totalRevenue
    }), { totalCount: 0, totalRevenue: 0 });

    // Calculate market share and AOV
    const processedData = productMixData.map(product => {
      const marketShare = totals.totalCount > 0 ? (product.count / totals.totalCount) * 100 : 0;
      const revenueShare = totals.totalRevenue > 0 ? (product.totalRevenue / totals.totalRevenue) * 100 : 0;

      return {
        productSku: product._id.productSku,
        productName: product._id.productName,
        price: product._id.price,
        count: product.count,
        totalRevenue: product.totalRevenue,
        avgOrderValue: Math.round(product.avgOrderValue * 100) / 100,
        marketShare: Math.round(marketShare * 100) / 100,
        revenueShare: Math.round(revenueShare * 100) / 100
      };
    });

    // Calculate overall AOV
    const overallAOV = totals.totalCount > 0 ? totals.totalRevenue / totals.totalCount : 0;

    // Time series data for AOV over time
    const timeSeriesPipeline = [
      ...pipeline.slice(0, -2), // Remove the last group and sort stages
      {
        $group: {
          _id: {
            year: { $year: '$redeemedAt' },
            month: { $month: '$redeemedAt' },
            day: { $dayOfMonth: '$redeemedAt' }
          },
          count: { $sum: 1 },
          totalRevenue: { $sum: { $ifNull: ['$amountGross', '$giftItem.price'] } }
        }
      },
      {
        $addFields: {
          avgOrderValue: { $divide: ['$totalRevenue', '$count'] },
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          }
        }
      },
      {
        $sort: { date: 1 }
      }
    ];

    const timeSeriesData = await Voucher.aggregate(timeSeriesPipeline);

    return NextResponse.json({
      success: true,
      data: {
        productMix: processedData,
        totals: {
          ...totals,
          overallAOV: Math.round(overallAOV * 100) / 100
        },
        timeSeries: timeSeriesData
      }
    });

  } catch (error) {
    console.error('Error fetching product mix data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product mix data' },
      { status: 500 }
    );
  }
}
