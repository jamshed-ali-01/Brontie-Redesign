import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import MerchantDemo from '@/models/MerchantDemo';
import GiftItem from '@/models/GiftItem';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('cafe-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { merchantId: string };
    const merchantId = decoded.merchantId;

    await connectToDatabase();

    // Fetch the merchant's first active gift item to make the demo realistic
    let giftItem = null;
    try {
      giftItem = await GiftItem.findOne({ merchantId, isActive: true });
    } catch (err) {
      console.warn('Could not fetch real gift item for demo:', err);
    }

    const demoSession = new MerchantDemo({
      merchantId,
      status: 'active',
      itemName: giftItem?.name || 'Cappuccino',
      itemPrice: giftItem?.price || 4.50,
      itemImage: giftItem?.imageUrl || '',
      recipientName: 'Demo recipient',
      senderName: 'Demo sender',
      message: 'Enjoy this coffee on me! ☕'
    });

    await demoSession.save();

    return NextResponse.json({ 
      success: true, 
      demoId: demoSession._id.toString() 
    });

  } catch (error: any) {
    console.error('[Demo API] Generation Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
    }

    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
  }
}
