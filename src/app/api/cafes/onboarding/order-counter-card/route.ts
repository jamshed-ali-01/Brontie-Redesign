import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import CounterCardOrder from '@/models/CounterCardOrder';
import Merchant from '@/models/Merchant';
import MerchantLocation from '@/models/MerchantLocation';
import { sendCounterCardOrderEmail } from '@/lib/email';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('cafe-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { merchantId: string };
    const merchantId = decoded.merchantId;

    await connectToDatabase();

    const body = await request.json();
    const { locationId, sendToAll } = body;

    // Save order
    const order = new CounterCardOrder({
      merchantId,
      locationId: sendToAll ? 'all' : locationId,
      sendToAll
    });
    await order.save();

    // Fetch details for email notification
    const merchant = await Merchant.findById(merchantId).select('name');
    
    let locationNames: string[] = [];
    if (sendToAll) {
       const locs = await MerchantLocation.find({ merchantId }).select('name');
       locationNames = locs.map(l => l.name);
    } else if (locationId) {
       const loc = await MerchantLocation.findById(locationId).select('name');
       if (loc) locationNames = [loc.name];
    }

    // Trigger Admin Email Alert
    if (merchant) {
       await sendCounterCardOrderEmail(merchant.name, {
          locationNames,
          sendToAll: !!sendToAll
       });
       console.log(`[CounterOrder] Email alert sent to admin for merchant: ${merchant.name}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Counter card order placed successfully' 
    });

  } catch (error) {
    console.error('Counter card order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
