import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import QRCode from '@/models/QRCode';
import Merchant from '@/models/Merchant';
import MerchantLocation from '@/models/MerchantLocation';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const locationId = searchParams.get('locationId');
    
    // Build query filter
    const query: any = { isActive: true };
    
    if (merchantId) {
      query.merchantId = merchantId;
    }
    
    if (locationId) {
      query.locationId = locationId;
    }
    
    // Find QR codes with populated merchant and location data
    const qrCodes = await QRCode.find(query)
      .populate({ path: 'merchantId', model: Merchant, select: 'name' })
      .populate({ path: 'locationId', model: MerchantLocation, select: 'name address' })
      .sort({ createdAt: -1 }); // Most recent first
    
    // Format the response
    const formattedQRCodes = qrCodes.map(qr => ({
      id: qr._id,
      shortId: qr.shortId,
      merchantId: qr.merchantId._id,
      locationId: qr.locationId._id,
      merchantName: qr.merchantId.name,
      locationName: qr.locationId.name,
      locationAddress: qr.locationId.address,
      createdAt: qr.createdAt,
      expiresAt: qr.expiresAt,
      isActive: qr.isActive,
      qrUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://brontie.ie'}/qr/${qr.shortId}`
    }));
    
    return NextResponse.json({
      success: true,
      qrCodes: formattedQRCodes
    }, { status: 200 });
    
  } catch (error) {
    console.error('QR list API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch QR codes' },
      { status: 500 }
    );
  }
}

