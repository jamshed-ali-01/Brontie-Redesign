import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Voucher from '@/models/Voucher';
import GiftItem from '@/models/GiftItem';
import Merchant from '@/models/Merchant';

export async function GET(_request: NextRequest) {
  try {
    await connectToDatabase();

    const vouchers = await Voucher.find({
      $or: [
        { message: { $exists: true, $ne: '' } },
        { messageCardId: { $exists: true, $ne: '' } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .populate({
        path: 'giftItemId',
        populate: { path: 'merchantId', select: 'name' },
      });

    const messages = vouchers.map((v: any) => ({
      _id: String(v._id),
      createdAt: v.createdAt,
      senderName: v.senderName || '',
      recipientName: v.recipientName || '',
      merchantName: v.giftItemId?.merchantId?.name || '',
      giftItemName: v.giftItemId?.name || '',
      amount: typeof v.amount === 'number' ? v.amount : undefined,
      message: v.message || '',
      messageCardId: v.messageCardId || '',
    }));

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('Admin messages API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
