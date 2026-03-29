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

    // Enforce minimum start date
    const MIN_START_ISO = '2025-09-26T08:16:00.000Z';
    if (!dateFrom || new Date(dateFrom) < new Date(MIN_START_ISO)) {
      dateFrom = MIN_START_ISO;
    }

    await connectToDatabase();

    const merchantObjectId = merchantId ? new (mongoose as any).Types.ObjectId(merchantId) : null;

    const dateFilter: { $gte?: Date; $lte?: Date } = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo) dateFilter.$lte = new Date(dateTo);

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

    if (merchantObjectId) {
      pipeline.push({
        $match: { 'giftItem.merchantId': merchantObjectId }
      });
    }

    if (Object.keys(dateFilter).length > 0) {
      pipeline.push({
        $match: { createdAt: dateFilter }
      });
    }

    // Group by recipient token to track viral conversions
    pipeline.push({
      $group: {
        _id: '$recipientToken',
        firstVoucher: { $first: '$$ROOT' },
        becameSender: { $max: '$recipientBecameSender' },
        senderEmail: { $first: '$recipientLinkedSenderEmail' },
        voucherCount: { $sum: 1 }
      }
    });

    const viralData = await Voucher.aggregate(pipeline);

    // --- FIXED: totalSenders calculation ---
    const initialSenders = new Set(
      viralData.map(v => v.firstVoucher.senderName).filter(Boolean)
    );

    const newSenders = new Set(
      viralData.filter(v => v.becameSender).map(v => v.senderEmail).filter(Boolean)
    );

    const totalSenders = new Set([...initialSenders]).size;

    const totalRecipients = viralData.length;
    const recipientsWhoBecameSenders = viralData.filter(v => v.becameSender).length;
    const viralConversionRate = totalRecipients > 0 ? (recipientsWhoBecameSenders / totalRecipients) * 100 : 0;
    const viralCoefficient = totalSenders > 0 ? totalRecipients / totalSenders : 0;

    // Time series pipeline (unchanged)
    const timeSeriesPipeline = [
      ...pipeline.slice(0, -1),
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          newRecipients: { $sum: 1 },
          becameSenders: { $sum: { $cond: ['$recipientBecameSender', 1, 0] } }
        }
      },
      {
        $addFields: {
          conversionRate: { $divide: ['$becameSenders', '$newRecipients'] },
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          }
        }
      },
      { $sort: { date: 1 } }
    ];

    const timeSeriesData = await Voucher.aggregate(timeSeriesPipeline);

    // Cohort analysis pipeline (unchanged)
    const cohortPipeline = [
      ...pipeline.slice(0, -1),
      {
        $group: {
          _id: {
            recipientMonth: {
              $dateFromParts: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              }
            },
            becameSender: '$recipientBecameSender'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.recipientMonth',
          totalRecipients: { $sum: '$count' },
          becameSenders: { 
            $sum: { $cond: ['$_id.becameSender', '$count', 0] } 
          }
        }
      },
      {
        $addFields: {
          conversionRate: { $divide: ['$becameSenders', '$totalRecipients'] }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const cohortData = await Voucher.aggregate(cohortPipeline);

    return NextResponse.json({
      success: true,
      data: {
        viralMetrics: {
          totalRecipients,
          recipientsWhoBecameSenders,
          viralConversionRate: Math.round(viralConversionRate * 100) / 100,
          totalSenders,
          viralCoefficient: Math.round(viralCoefficient * 100) / 100
        },
        timeSeries: timeSeriesData,
        cohortAnalysis: cohortData
      }
    });

  } catch (error) {
    console.error('Error fetching customer acquisition data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer acquisition data' },
      { status: 500 }
    );
  }
}
