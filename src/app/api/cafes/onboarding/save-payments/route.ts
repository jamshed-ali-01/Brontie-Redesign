import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Merchant from '@/models/Merchant';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('cafe-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { merchantId: string };
    const merchantId = decoded.merchantId;

    await connectToDatabase();

    const body = await request.json();
    const { skip } = body;

    // Advance to Step 6 (Test Coffee)
    await Merchant.findByIdAndUpdate(merchantId, { signupStep: 6 });

    return NextResponse.json({ 
      success: true, 
      message: 'Payment setup updated' 
    });

  } catch (error) {
    console.error('Payment save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
