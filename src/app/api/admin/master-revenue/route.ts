import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Voucher from '@/models/Voucher';
import Merchant from '@/models/Merchant';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Enforce minimum start date: Sep 26, 2025 08:16 AM UTC
    const MIN_START_ISO = '2025-09-26T08:16:00.000Z';
    if (!dateFrom || new Date(dateFrom) < new Date(MIN_START_ISO)) {
      dateFrom = MIN_START_ISO;
    }

    await connectToDatabase();

    // Build date filter
    const dateFilter: { $gte?: Date; $lte?: Date } = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo) dateFilter.$lte = new Date(dateTo);

    // MongoDB aggregation pipeline for master revenue
    const pipeline: any[] = [
      {
        $match: {
          status: { $in: ['redeemed', 'issued', 'pending', 'unredeemed'] }, // Include all voucher statuses
          ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}) // Use createdAt instead of redeemedAt
        }
      },
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
      {
        $group: {
          _id: '$giftItem.merchantId',
          merchantName: { $first: '$merchant.name' },
          merchantStatus: { $first: '$merchant.status' },
          totalGrossRevenue: { 
            $sum: { 
              $ifNull: ['$amountGross', '$giftItem.price'] 
            } 
          },
          redeemedRevenue: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'redeemed'] },
                { $ifNull: ['$amountGross', '$giftItem.price'] },
                0
              ]
            }
          },
          totalStripeFees: { 
            $sum: { 
              $cond: [
                { $eq: ['$status', 'redeemed'] },
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
                },
                0
              ]
            } 
          },
          totalVoucherCount: { $sum: 1 },
          redeemedVoucherCount: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'redeemed'] },
                1,
                0
              ]
            }
          },
          merchantCreatedAt: { $first: '$merchant.createdAt' },
          merchantBrontieFeeSettings: { $first: '$merchant.brontieFeeSettings' }
        }
      }
    ];

    const revenueData = await Voucher.aggregate(pipeline);

    // Get all approved merchants to include those with zero redeemed vouchers
    const allMerchants = await Merchant.find({ status: 'approved' }).select('_id name status createdAt brontieFeeSettings');

    // Create a map of merchant revenue data
    const revenueMap = new Map(
      revenueData.map(merchant => [merchant._id.toString(), merchant])
    );

    // Process all merchants, including those with no vouchers
    const processedData = allMerchants.map(merchant => {
      const revenueInfo = revenueMap.get(merchant._id.toString());
      
      const totalRevenue = revenueInfo?.totalGrossRevenue || 0; // All vouchers (redeemed + unredeemed)
      const redeemedRevenue = revenueInfo?.redeemedRevenue || 0; // Only redeemed vouchers
      const totalStripeFees = revenueInfo?.totalStripeFees || 0;
      const totalVoucherCount = revenueInfo?.totalVoucherCount || 0;
      const redeemedVoucherCount = revenueInfo?.redeemedVoucherCount || 0;
      const netAfterStripe = redeemedRevenue - totalStripeFees; // Only calculate fees on redeemed vouchers
      
      const isBrontieFeeActive = !!(merchant.brontieFeeSettings && merchant.brontieFeeSettings.isActive);
      const commissionRate = isBrontieFeeActive
        ? (merchant.brontieFeeSettings?.commissionRate ?? 0.10)
        : 0;
      
      const brontieFee = netAfterStripe * commissionRate;
      const netToCafe = netAfterStripe - brontieFee;

      return {
        merchantId: merchant._id,
        merchantName: merchant.name,
        merchantStatus: merchant.status,
        totalRevenue: Math.round(totalRevenue * 100) / 100, // All vouchers
        totalGrossRevenue: Math.round(redeemedRevenue * 100) / 100, // Only redeemed (for backward compatibility)
        redeemedRevenue: Math.round(redeemedRevenue * 100) / 100, // Only redeemed
        totalStripeFees: Math.round(totalStripeFees * 100) / 100,
        totalBrontieFees: Math.round(brontieFee * 100) / 100,
        netToCafe: Math.round(netToCafe * 100) / 100,
        brontieNetRevenue: Math.round(brontieFee * 100) / 100,
        totalVoucherCount: totalVoucherCount, // All vouchers
        voucherCount: redeemedVoucherCount, // Only redeemed (for backward compatibility)
        redeemedVoucherCount: redeemedVoucherCount, // Only redeemed
        stripeFeePercentage: redeemedRevenue > 0 ? Math.round((totalStripeFees / redeemedRevenue) * 10000) / 100 : 0,
        brontieFeePercentage: redeemedRevenue > 0 ? Math.round((brontieFee / redeemedRevenue) * 10000) / 100 : 0,
        netToCafePercentage: redeemedRevenue > 0 ? Math.round((netToCafe / redeemedRevenue) * 10000) / 100 : 0,
        isBrontieFeeActive,
        commissionRate
      };
    });

    // Calculate overall totals
    const overallTotals = processedData.reduce((acc, merchant) => ({
      totalRevenue: acc.totalRevenue + merchant.totalRevenue, // All vouchers
      totalGrossRevenue: acc.totalGrossRevenue + merchant.totalGrossRevenue, // Only redeemed
      redeemedRevenue: acc.redeemedRevenue + merchant.redeemedRevenue, // Only redeemed
      totalStripeFees: acc.totalStripeFees + merchant.totalStripeFees,
      totalBrontieFees: acc.totalBrontieFees + merchant.totalBrontieFees,
      netToCafe: acc.netToCafe + merchant.netToCafe,
      brontieNetRevenue: acc.brontieNetRevenue + merchant.brontieNetRevenue,
      totalVoucherCount: acc.totalVoucherCount + merchant.totalVoucherCount, // All vouchers
      voucherCount: acc.voucherCount + merchant.voucherCount, // Only redeemed
      redeemedVoucherCount: acc.redeemedVoucherCount + merchant.redeemedVoucherCount // Only redeemed
    }), {
      totalRevenue: 0,
      totalGrossRevenue: 0,
      redeemedRevenue: 0,
      totalStripeFees: 0,
      totalBrontieFees: 0,
      netToCafe: 0,
      brontieNetRevenue: 0,
      totalVoucherCount: 0,
      voucherCount: 0,
      redeemedVoucherCount: 0
    });

    // Calculate percentages
    const overallPercentages = {
      stripeFeePercentage: overallTotals.totalGrossRevenue > 0 
        ? Math.round((overallTotals.totalStripeFees / overallTotals.totalGrossRevenue) * 10000) / 100 
        : 0,
      brontieFeePercentage: overallTotals.totalGrossRevenue > 0 
        ? Math.round((overallTotals.totalBrontieFees / overallTotals.totalGrossRevenue) * 10000) / 100 
        : 0,
      netToCafePercentage: overallTotals.totalGrossRevenue > 0 
        ? Math.round((overallTotals.netToCafe / overallTotals.totalGrossRevenue) * 10000) / 100 
        : 0
    };

    return NextResponse.json({
      success: true,
      data: {
        byMerchant: processedData,
        overall: {
          ...overallTotals,
          ...overallPercentages
        }
      }
    });

  } catch (error) {
    console.error('Error fetching master revenue data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch master revenue data' },
      { status: 500 }
    );
  }
}
