import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    // Get merchant ID from JWT token
    const token = request.cookies.get('cafe-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { merchantId: string };
    const merchantId = decoded.merchantId;

    if (!merchantId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Convert merchantId to ObjectId
    const merchantObjectId = new mongoose.Types.ObjectId(merchantId);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'purchase', 'redemption', or null for all
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Build match criteria
    const matchCriteria: Record<string, unknown> = {
      merchantId: merchantObjectId,
      status: 'completed'
    };

    if (type && ['purchase', 'redemption', 'refund'].includes(type)) {
      matchCriteria.type = type;
    }

    // Get transactions with pagination
    const transactions = await Transaction.aggregate([
      {
        $match: matchCriteria
      },
      {
        $lookup: {
          from: 'giftitems',
          localField: 'giftItemId',
          foreignField: '_id',
          as: 'giftItem'
        }
      },
      {
        $unwind: '$giftItem'
      },
      {
        $lookup: {
          from: 'vouchers',
          localField: 'voucherId',
          foreignField: '_id',
          as: 'voucher'
        }
      },
      {
        $unwind: '$voucher'
      },
      {
        $project: {
          _id: 1,
          type: 1,
          amount: 1,
          status: 1,
          customerEmail: 1,
          senderName: 1,
          recipientName: 1,
          stripeFee: 1,
          brontieCommission: 1,
          merchantPayout: 1,
          createdAt: 1,
          completedAt: 1,
          giftItem: {
            name: 1,
            price: 1,
            imageUrl: 1
          },
          voucher: {
            redemptionCode: 1,
            redemptionLink: 1
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      }
    ]);

    // Get total count for pagination
    const totalCount = await Transaction.countDocuments(matchCriteria);

    // Calculate summary statistics
    const summary = await Transaction.aggregate([
      {
        $match: {
          merchantId: merchantObjectId,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalStripeFees: { $sum: '$stripeFee' },
          totalCommission: { $sum: '$brontieCommission' },
          totalPayout: { $sum: '$merchantPayout' }
        }
      }
    ]);

    // Format summary
    const summaryData = {
      purchase: summary.find(s => s._id === 'purchase') || { count: 0, totalAmount: 0, totalStripeFees: 0, totalCommission: 0, totalPayout: 0 },
      redemption: summary.find(s => s._id === 'redemption') || { count: 0, totalAmount: 0, totalStripeFees: 0, totalCommission: 0, totalPayout: 0 },
      refund: summary.find(s => s._id === 'refund') || { count: 0, totalAmount: 0, totalStripeFees: 0, totalCommission: 0, totalPayout: 0 }
    };

    return NextResponse.json({
      success: true,
      transactions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      summary: summaryData
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
