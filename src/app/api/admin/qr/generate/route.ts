import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import MerchantLocation from '@/models/MerchantLocation';
import Merchant from '@/models/Merchant';
import QRCode from '@/models/QRCode';
import { generateShortId, generateQRCodeURL } from '@/lib/qr-generator';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { merchantId, locationId } = body;

    // Validate required fields
    if (!merchantId || !locationId) {
      return NextResponse.json(
        { error: 'Missing required fields: merchantId and locationId' },
        { status: 400 }
      );
    }

    // Verify merchant exists
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Verify location exists and belongs to merchant
    const location = await MerchantLocation.findById(locationId);
    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    if (location.merchantId.toString() !== merchantId) {
      return NextResponse.json(
        { error: 'Location does not belong to the specified merchant' },
        { status: 400 }
      );
    }

    // Check if there's already an active QR code for this location
    const existingQR = await QRCode.findOne({
      locationId,
      isActive: true,
      expiresAt: { $gt: new Date() } // Not expired
    });

    if (existingQR) {
      return NextResponse.json(
        {
          error: 'Location already has an active QR code',
          existingQR: {
            id: existingQR._id,
            shortId: existingQR.shortId,
            createdAt: existingQR.createdAt,
            expiresAt: existingQR.expiresAt
          }
        },
        { status: 409 } // Conflict status
      );
    }

    // Generate a short unique ID
    let shortId: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure the short ID is unique
    while (!isUnique && attempts < maxAttempts) {
      shortId = generateShortId(8);
      const existing = await QRCode.findOne({ shortId });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: 'Failed to generate unique QR code ID' },
        { status: 500 }
      );
    }

    // Store QR code data in database
    const qrCodeRecord = new QRCode({
      shortId: shortId!,
      merchantId,
      locationId,
      isActive: true
    });

    await qrCodeRecord.save();

    // Generate the short QR URL
    const qrUrl = generateQRCodeURL(shortId!);

    return NextResponse.json({
      success: true,
      qrUrl,
      shortId: shortId!,
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
    console.error('QR generation API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}
