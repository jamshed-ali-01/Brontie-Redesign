import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import GenericQRCode from '@/models/GenericQRCode';

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
    const qrRecord = await GenericQRCode.findOne({ 
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
    
    // Update scan count and last scanned time
    await GenericQRCode.findByIdAndUpdate(qrRecord._id, {
      $inc: { scanCount: 1 },
      lastScannedAt: new Date()
    });
    
    return NextResponse.json({
      success: true,
      type: qrRecord.type,
      targetUrl: qrRecord.targetUrl,
      description: qrRecord.description,
      scanCount: qrRecord.scanCount + 1
    }, { status: 200 });
    
  } catch (error) {
    console.error('Generic QR validation API error:', error);
    return NextResponse.json(
      { error: 'Failed to validate QR code' },
      { status: 500 }
    );
  }
}

