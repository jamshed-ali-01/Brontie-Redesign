import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import QRCode from '@/models/QRCode';
import Merchant from '@/models/Merchant';
import MerchantLocation from '@/models/MerchantLocation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> }
) {
  try {
    await connectToDatabase();
    
    const { shortId } = await params;
    
    if (!shortId) {
      return NextResponse.json(
        { error: 'Missing QR code ID' },
        { status: 400 }
      );
    }
    
    // Find the QR code record
    const qrRecord = await QRCode.findOne({ 
      shortId, 
      isActive: true,
      expiresAt: { $gt: new Date() } // Check if not expired
    });
    
    if (!qrRecord) {
      return NextResponse.json(
        { error: 'QR code not found or expired' },
        { status: 404 }
      );
    }
    
    // Get merchant and location details using the ObjectIds
    const merchant = await Merchant.findById(qrRecord.merchantId);
    const location = await MerchantLocation.findById(qrRecord.locationId);
    
    if (!merchant || !location) {
      return NextResponse.json(
        { error: 'Associated merchant or location not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      merchantId: qrRecord.merchantId.toString(),
      locationId: qrRecord.locationId.toString(),
      merchant: {
        id: merchant._id,
        name: merchant.name
      },
      location: {
        id: location._id,
        name: location.name,
        address: location.address
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('QR validation API error:', error);
    return NextResponse.json(
      { error: 'Failed to validate QR code' },
      { status: 500 }
    );
  }
}
