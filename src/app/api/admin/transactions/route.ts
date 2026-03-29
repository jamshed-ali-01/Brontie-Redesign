import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Voucher from '@/models/Voucher';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const merchantId = searchParams.get('merchantId');
    const giftItemId = searchParams.get('giftItemId');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const redeemedDateFrom = searchParams.get('redeemedDateFrom');
    const redeemedDateTo = searchParams.get('redeemedDateTo');
    const isExport = searchParams.get('export') === 'true';

    console.log('🔍 API Request Parameters:', {
      page, limit, merchantId, giftItemId, status, 
      dateFrom, dateTo, redeemedDateFrom, redeemedDateTo, isExport
    });

    // Build match stage
    const matchStage: any = {};

    // Gift Item filter
    if (giftItemId && mongoose.Types.ObjectId.isValid(giftItemId)) {
      matchStage.giftItemId = new mongoose.Types.ObjectId(giftItemId);
    }

    // Status filter
    if (status) {
      matchStage.status = status;
    }

    // Created Date range filter
    if (dateFrom || dateTo) {
      matchStage.createdAt = {};
      if (dateFrom) {
        matchStage.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        matchStage.createdAt.$lte = endDate;
      }
    }

    // Redeemed Date range filter
    if (redeemedDateFrom || redeemedDateTo) {
      matchStage.redeemedAt = {};
      if (redeemedDateFrom) {
        matchStage.redeemedAt.$gte = new Date(redeemedDateFrom);
      }
      if (redeemedDateTo) {
        const endDate = new Date(redeemedDateTo);
        endDate.setHours(23, 59, 59, 999);
        matchStage.redeemedAt.$lte = endDate;
      }
    }

    console.log('🎯 Match Stage:', JSON.stringify(matchStage, null, 2));

    // Base aggregation pipeline
    const basePipeline: any[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'giftitems',
          localField: 'giftItemId',
          foreignField: '_id',
          as: 'giftItem'
        }
      },
      { $unwind: { path: '$giftItem', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'merchants',
          localField: 'giftItem.merchantId',
          foreignField: '_id',
          as: 'merchant'
        }
      },
      { $unwind: { path: '$merchant', preserveNullAndEmptyArrays: true } }
    ];

    // Add merchant filter
    if (merchantId && mongoose.Types.ObjectId.isValid(merchantId)) {
      basePipeline.push({
        $match: {
          'merchant._id': new mongoose.Types.ObjectId(merchantId)
        }
      });
    }

    // Add location lookups
    basePipeline.push(
      {
        $lookup: {
          from: 'merchantlocations',
          localField: 'validLocationIds',
          foreignField: '_id',
          as: 'validLocations'
        }
      },
      {
        $lookup: {
          from: 'redemptionlogs',
          localField: '_id',
          foreignField: 'voucherId',
          as: 'redemptionLog'
        }
      },
      {
        $lookup: {
          from: 'merchantlocations',
          localField: 'redemptionLog.merchantLocationId',
          foreignField: '_id',
          as: 'redemptionLocation'
        }
      }
    );

    // Debug: Check pipeline results
    const debugResults = await Voucher.aggregate([...basePipeline]);
    console.log('🐛 Debug - Documents after pipeline:', debugResults.length);

    if (isExport) {
      // Export logic
      const vouchers = await Voucher.aggregate([
        ...basePipeline,
        { $sort: { createdAt: -1 } },
        {
          $project: {
            _id: 1,
            giftItemName: '$giftItem.name',
            merchantName: '$merchant.name',
            locationName: {
              $cond: {
                if: { $gt: [{ $size: '$redemptionLocation' }, 0] },
                then: { $arrayElemAt: ['$redemptionLocation.name', 0] },
                else: { $arrayElemAt: ['$validLocations.name', 0] }
              }
            },
            amount: { 
              $ifNull: ['$amount', { $ifNull: ['$giftItem.price', 0] }]
            },
            status: 1,
            recipientName: 1,
            senderName: 1,
            createdAt: 1,
            redeemedAt: 1,
            paymentIntentId: 1
          }
        }
      ]);
      
      const csvHeaders = ['ID', 'Gift Item', 'Merchant', 'Location', 'Price', 'Status', 'Recipient Name', 'Sender Name', 'Created Date', 'Redeemed Date', 'Payment ID'];
      const csvRows = vouchers.map(voucher => [
        voucher._id.toString(),
        voucher.giftItemName || 'N/A',
        voucher.merchantName || 'N/A',
        voucher.locationName || 'N/A',
        (voucher.amount || 0).toString(),
        voucher.status,
        voucher.recipientName || 'N/A',
        voucher.senderName || 'N/A',
        voucher.createdAt.toISOString(),
        voucher.redeemedAt ? voucher.redeemedAt.toISOString() : 'N/A',
        voucher.paymentIntentId || 'N/A'
      ]);
      
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="transactions.csv"'
        }
      });
    }
    
    // Regular paginated response
    const skip = (page - 1) * limit;
    
    // Get total count
    const totalResult = await Voucher.aggregate([
      ...basePipeline,
      { $count: 'total' }
    ]);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;
    
    // Get paginated results
    const vouchers = await Voucher.aggregate([
      ...basePipeline,
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          giftItemName: '$giftItem.name',
          giftItemId: '$giftItem._id',
          merchantName: '$merchant.name',
          merchantId: '$merchant._id',
          locationName: {
            $cond: {
              if: { $gt: [{ $size: '$redemptionLocation' }, 0] },
              then: { $arrayElemAt: ['$redemptionLocation.name', 0] },
              else: { $arrayElemAt: ['$validLocations.name', 0] }
            }
          },
          locationId: {
            $cond: {
              if: { $gt: [{ $size: '$redemptionLocation' }, 0] },
              then: { $arrayElemAt: ['$redemptionLocation._id', 0] },
              else: { $arrayElemAt: ['$validLocations._id', 0] }
            }
          },
          amount: 1,
          status: 1,
          recipientName: 1,
          senderName: 1,
          createdAt: 1,
          redeemedAt: 1,
          paymentIntentId: 1,
          sessionId: 1
        }
      }
    ]);
    
    // Transform data
    const transactions = vouchers.map(voucher => ({
      _id: voucher._id.toString(),
      giftItemName: voucher.giftItemName || 'Unknown',
      giftItemId: voucher.giftItemId?.toString() || '',
      merchantName: voucher.merchantName || 'Unknown',
      merchantId: voucher.merchantId?.toString() || '',
      locationName: voucher.locationName || 'Unknown',
      locationId: voucher.locationId?.toString() || '',
      amount: voucher.amount || 0,
      status: voucher.status,
      recipientName: voucher.recipientName || '',
      senderName: voucher.senderName || '',
      createdAt: voucher.createdAt.toISOString(),
      redeemedAt: voucher.redeemedAt ? voucher.redeemedAt.toISOString() : undefined,
      paymentIntentId: voucher.paymentIntentId || '',
      sessionId: voucher.sessionId || ''
    }));

    console.log('✅ Final transactions:', transactions.length);
    
    return NextResponse.json({
      success: true,
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
    
  } catch (error) {
    console.error('❌ Error in transactions API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}