import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Voucher from '@/models/Voucher';
import mongoose from 'mongoose';


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    let dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Enforce minimum start date: Sep 26, 2025 08:16 AM UTC
    const MIN_START_ISO = '2025-09-26T08:16:00.000Z';
    if (!dateFrom || new Date(dateFrom) < new Date(MIN_START_ISO)) {
      dateFrom = MIN_START_ISO;
    }

    await connectToDatabase();

    // Convert merchantId to ObjectId if provided
    const merchantObjectId = merchantId ? new (mongoose as any).Types.ObjectId(merchantId) : null;

    // Build date filter
    const dateFilter: Record<string, unknown> = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo) dateFilter.$lte = new Date(dateTo);

    // MongoDB aggregation pipeline for redemption delay
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

    // Only include redeemed vouchers
    pipeline.push({
      $match: { 
        status: 'redeemed',
        issuedAt: { $exists: true },
        redeemedAt: { $exists: true }
      }
    });

    // Restrict by createdAt (voucher created after min date)
    if (Object.keys(dateFilter).length > 0) {
      pipeline.push({ $match: { createdAt: dateFilter } });
    }

    // Calculate redemption delay in days
    pipeline.push({
      $addFields: {
        redemptionDelayDays: {
          $divide: [
            { $subtract: ['$redeemedAt', '$issuedAt'] },
            1000 * 60 * 60 * 24 // Convert milliseconds to days
          ]
        }
      }
    });

    // Group and calculate statistics
    pipeline.push({
      $group: {
        _id: null,
        count: { $sum: 1 },
        avgDelay: { $avg: '$redemptionDelayDays' },
        medianDelay: { $avg: '$redemptionDelayDays' }, // Simplified median
        minDelay: { $min: '$redemptionDelayDays' },
        maxDelay: { $max: '$redemptionDelayDays' },
        delays: { $push: '$redemptionDelayDays' }
      }
    });

    const delayStats = await Voucher.aggregate(pipeline);

    // Create histogram data
    const histogramPipeline = [
      ...pipeline.slice(0, -1), // Remove the last group stage
      {
        $bucket: {
          groupBy: '$redemptionDelayDays',
          boundaries: [0, 1, 3, 7, 14, 30, 60, 90, 365],
          default: '365+',
          output: {
            count: { $sum: 1 },
            avgAmount: { $avg: { $ifNull: ['$amountGross', '$giftItem.price'] } }
          }
        }
      }
    ];

    const histogramData = await Voucher.aggregate(histogramPipeline);

    // Calculate percentiles
    let percentiles = {
      p25: 0,
      p50: 0,
      p75: 0,
      p90: 0
    };

    if (delayStats.length > 0 && delayStats[0].delays) {
      const delays = delayStats[0].delays.sort((a: number, b: number) => a - b);
      const len = delays.length;
      
      percentiles = {
        p25: delays[Math.floor(len * 0.25)],
        p50: delays[Math.floor(len * 0.50)],
        p75: delays[Math.floor(len * 0.75)],
        p90: delays[Math.floor(len * 0.90)]
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        statistics: delayStats.length > 0 ? {
          count: delayStats[0].count,
          avgDelay: Math.round(delayStats[0].avgDelay * 100) / 100,
          medianDelay: Math.round(percentiles.p50 * 100) / 100,
          minDelay: Math.round(delayStats[0].minDelay * 100) / 100,
          maxDelay: Math.round(delayStats[0].maxDelay * 100) / 100,
          percentiles
        } : {
          count: 0,
          avgDelay: 0,
          medianDelay: 0,
          minDelay: 0,
          maxDelay: 0,
          percentiles
        },
        histogram: histogramData
      }
    });

  } catch (error) {
    console.error('Error fetching redemption delay data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch redemption delay data' },
      { status: 500 }
    );
  }
}
