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

    // MongoDB aggregation pipeline for fees breakdown
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
      {
        $lookup: {
          from: 'merchants',
          localField: 'giftItem.merchantId',
          foreignField: '_id',
          as: 'merchant',
        },
      },
      {
        $unwind: '$merchant',
      },
    ];

    // Add merchant filter if specified
    if (merchantObjectId) {
      pipeline.push({
        $match: { 'giftItem.merchantId': merchantObjectId }
      });
    }

    // Only include redeemed vouchers for fees calculation
    pipeline.push({
      $match: { status: 'redeemed' }
    });

    // Restrict to vouchers created at/after the date filter (orders created from day 26)
    if (Object.keys(dateFilter).length > 0) {
      pipeline.push({
        $match: { createdAt: dateFilter }
      });
    }

    // Calculate fees and group by merchant
    pipeline.push({
      $group: {
        _id: '$giftItem.merchantId',
        merchantName: { $first: '$merchant.name' },
        merchantBrontieFeeSettings: { $first: '$merchant.brontieFeeSettings' },
        totalGross: { 
          $sum: { 
            $ifNull: ['$amountGross', '$giftItem.price'] 
          } 
        },
        totalStripeFees: { 
          $sum: { 
            $ifNull: [
              '$stripeFee', 
              { 
                $add: [
                  { $multiply: [{ $ifNull: ['$amountGross', '$giftItem.price'] }, 0.014] },
                  0.25
                ]
              }
            ] 
          } 
        },
        computedBrontieFeesBase: {
          $sum: {
            $subtract: [
              { $ifNull: ['$amountGross', '$giftItem.price'] },
              { 
                $ifNull: [
                  '$stripeFee', 
                  { 
                    $add: [
                      { $multiply: [{ $ifNull: ['$amountGross', '$giftItem.price'] }, 0.014] },
                      0.25
                    ]
                  }
                ]
              }
            ]
          }
        },
        voucherCount: { $sum: 1 }
      }
    });

    const feesData = await Voucher.aggregate(pipeline);

    // Calculate net amounts
    const processedData = feesData.map(merchant => {
      const netAfterStripe = merchant.totalGross - merchant.totalStripeFees;
      const isBrontieFeeActive = !!(merchant.merchantBrontieFeeSettings && merchant.merchantBrontieFeeSettings.isActive);
      const commissionRate = isBrontieFeeActive
        ? (merchant.merchantBrontieFeeSettings?.commissionRate ?? 0.10)
        : 0;
      const totalBrontieFees = merchant.computedBrontieFeesBase * commissionRate;
      const netToCafe = netAfterStripe - totalBrontieFees;

      return {
        merchantId: merchant._id,
        merchantName: merchant.merchantName,
        totalGross: merchant.totalGross,
        totalStripeFees: merchant.totalStripeFees,
        totalBrontieFees,
        netToCafe: netToCafe,
        voucherCount: merchant.voucherCount,
        stripeFeePercentage: merchant.totalGross > 0 ? (merchant.totalStripeFees / merchant.totalGross) * 100 : 0,
        brontieFeePercentage: merchant.totalGross > 0 ? (totalBrontieFees / merchant.totalGross) * 100 : 0,
        netToCafePercentage: merchant.totalGross > 0 ? (netToCafe / merchant.totalGross) * 100 : 0,
        isBrontieFeeActive,
        commissionRate
      };
    });

    // Calculate overall totals
    const overallTotals = processedData.reduce((acc, merchant) => ({
      totalGross: acc.totalGross + merchant.totalGross,
      totalStripeFees: acc.totalStripeFees + merchant.totalStripeFees,
      totalBrontieFees: acc.totalBrontieFees + merchant.totalBrontieFees,
      netToCafe: acc.netToCafe + merchant.netToCafe,
      voucherCount: acc.voucherCount + merchant.voucherCount
    }), {
      totalGross: 0,
      totalStripeFees: 0,
      totalBrontieFees: 0,
      netToCafe: 0,
      voucherCount: 0
    });

    return NextResponse.json({
      success: true,
      data: {
        byMerchant: processedData,
        overallTotals: {
          ...overallTotals,
          stripeFeePercentage: overallTotals.totalGross > 0 ? (overallTotals.totalStripeFees / overallTotals.totalGross) * 100 : 0,
          brontieFeePercentage: overallTotals.totalGross > 0 ? (overallTotals.totalBrontieFees / overallTotals.totalGross) * 100 : 0,
          netToCafePercentage: overallTotals.totalGross > 0 ? (overallTotals.netToCafe / overallTotals.totalGross) * 100 : 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching fees data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fees data' },
      { status: 500 }
    );
  }
}
