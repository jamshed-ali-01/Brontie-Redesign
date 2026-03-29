import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import QRCode from '@/models/QRCode';
import MerchantLocation from '@/models/MerchantLocation';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    
    if (!locationId) {
      return NextResponse.json(
        { error: 'Missing locationId parameter' },
        { status: 400 }
      );
    }
    
    // Check if there's an existing active QR code for this location
    const existingQR = await QRCode.findOne({ 
      locationId, 
      isActive: true,
      expiresAt: { $gt: new Date() } // Not expired
    }).populate('locationId', 'name address');
    
    if (existingQR) {
      return NextResponse.json({
        success: true,
        hasExisting: true,
        existingQR: {
          id: existingQR._id,
          shortId: existingQR.shortId,
          createdAt: existingQR.createdAt,
          expiresAt: existingQR.expiresAt,
          locationName: existingQR.locationId.name,
          locationAddress: existingQR.locationId.address,
          qrUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://brontie.ie'}/qr/${existingQR.shortId}`
        }
      }, { status: 200 });
    }
    
    return NextResponse.json({
      success: true,
      hasExisting: false
    }, { status: 200 });
    
  } catch (error) {
    console.error('QR check existing API error:', error);
    return NextResponse.json(
      { error: 'Failed to check for existing QR code' },
      { status: 500 }
    );
  }
}

