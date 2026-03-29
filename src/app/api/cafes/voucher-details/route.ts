import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Voucher from '@/models/Voucher';
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

    // Enforce minimum start date: Sep 26, 2025 08:16 AM UTC
    const MIN_START_ISO = '2025-09-26T08:16:00.000Z';
    const minStartDate = new Date(MIN_START_ISO);

    // Get active vouchers with details
    const activeVouchers = await Voucher.aggregate([
      {
        $lookup: {
          from: 'giftitems',
          localField: 'giftItemId',
          foreignField: '_id',
          as: 'giftItem'
        }
      },
      { $match: { createdAt: { $gte: minStartDate } } },
      {
        $unwind: '$giftItem'
      },
      {
        $match: {
          'giftItem.merchantId': merchantObjectId,
          status: { $in: ['issued', 'pending', 'unredeemed'] },
          createdAt: { $gte: minStartDate }
        }
      },
      {
        $lookup: {
          from: 'transactions',
          localField: '_id',
          foreignField: 'voucherId',
          as: 'transaction'
        }
      },
      {
        $addFields: {
          transaction: { $arrayElemAt: ['$transaction', 0] }
        }
      },
      {
        $project: {
          _id: 1,
          giftItemName: '$giftItem.name',
          giftItemPrice: { $ifNull: ["$amountGross", { $ifNull: ["$amount", "$giftItem.price"] }] },
          giftItemDescription: '$giftItem.description',
          giftItemImage: '$giftItem.imageUrl',
          purchaseDate: { $ifNull: ['$transaction.createdAt', '$createdAt'] },
          senderName: { $ifNull: ['$transaction.senderName', '$senderName'] },
          recipientName: { $ifNull: ['$transaction.recipientName', '$recipientName'] },
          recipientEmail: { $ifNull: ['$transaction.recipientEmail', '$email'] },
          message: { $ifNull: ['$transaction.message', ''] },
          status: 1
        }
      },
      {
        $sort: { purchaseDate: -1 }
      }
    ]);

    // Get redeemed vouchers with details
    const redeemedVouchers = await Voucher.aggregate([
      {
        $lookup: {
          from: 'giftitems',
          localField: 'giftItemId',
          foreignField: '_id',
          as: 'giftItem'
        }
      },
      { $match: { createdAt: { $gte: minStartDate } } },
      {
        $unwind: '$giftItem'
      },
      {
        $match: {
          'giftItem.merchantId': merchantObjectId,
          status: 'redeemed',
          createdAt: { $gte: minStartDate }
        }
      },
      {
        $lookup: {
          from: 'transactions',
          localField: '_id',
          foreignField: 'voucherId',
          as: 'transaction'
        }
      },
      {
        $addFields: {
          transaction: { $arrayElemAt: ['$transaction', 0] }
        }
      },
      {
        $project: {
          _id: 1,
          giftItemName: '$giftItem.name',
          giftItemPrice: { $ifNull: ["$amountGross", { $ifNull: ["$amount", "$giftItem.price"] }] },
          giftItemDescription: '$giftItem.description',
          giftItemImage: '$giftItem.imageUrl',
          purchaseDate: { $ifNull: ['$transaction.createdAt', '$createdAt'] },
          redemptionDate: '$redeemedAt',
          senderName: { $ifNull: ['$transaction.senderName', '$senderName'] },
          recipientName: { $ifNull: ['$transaction.recipientName', '$recipientName'] },
          recipientEmail: { $ifNull: ['$transaction.recipientEmail', '$email'] },
          message: { $ifNull: ['$transaction.message', ''] },
          status: 1
        }
      },
      {
        $sort: { redemptionDate: -1 }
      }
    ]);

    return NextResponse.json({
      activeVouchers,
      redeemedVouchers
    });

  } catch (error) {
    console.error('Voucher details API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
