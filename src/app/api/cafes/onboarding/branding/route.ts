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
    const { logoUrl, brandingPhotoUrl, useDefaults } = body;

    // Advance to Step 5
    const updates: any = { signupStep: 5 };
    
    if (!useDefaults) {
      if (logoUrl) updates.logoUrl = logoUrl;
      if (brandingPhotoUrl) updates.brandingPhotoUrl = brandingPhotoUrl;
    } else {
      // If using defaults, we might set placeholder URLs or just leave them blank/null
      // For now, let's keep it flexible
    }

    await Merchant.findByIdAndUpdate(merchantId, updates);

    return NextResponse.json({ 
      success: true, 
      message: 'Branding updated successfully' 
    });

  } catch (error) {
    console.error('Branding save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
