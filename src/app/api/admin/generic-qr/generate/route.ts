import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import GenericQRCode from '@/models/GenericQRCode';
import { generateShortId, generateQRCodeURL } from '@/lib/qr-generator';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { type, targetUrl, description } = body;
    
    // Validate required fields
    if (!type || !targetUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: type and targetUrl' },
        { status: 400 }
      );
    }
    
    // Validate type
    if (!['homepage', 'products', 'custom'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be: homepage, products, or custom' },
        { status: 400 }
      );
    }
    
    // If an active generic QR with same targetUrl and description exists, reuse it
    const existingSame = await GenericQRCode.findOne({ 
      targetUrl, 
      description: description || null,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });
    if (existingSame) {
      const qrUrl = generateQRCodeURL(existingSame.shortId);
      return NextResponse.json({
        success: true,
        reused: true,
        qrUrl,
        shortId: existingSame.shortId,
        type: existingSame.type,
        targetUrl: existingSame.targetUrl,
        description: existingSame.description
      }, { status: 200 });
    }

    // Generate a short unique ID
    let shortId: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    // Ensure the short ID is unique
    while (!isUnique && attempts < maxAttempts) {
      shortId = generateShortId(8);
      const existing = await GenericQRCode.findOne({ shortId });
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
    const qrCodeRecord = new GenericQRCode({
      shortId: shortId!,
      type,
      targetUrl,
      description,
      isActive: true
    });
    
    await qrCodeRecord.save();
    
    // Generate the short QR URL
    const qrUrl = generateQRCodeURL(shortId!);
    
    return NextResponse.json({
      success: true,
      qrUrl,
      shortId: shortId!,
      type,
      targetUrl,
      description
    }, { status: 200 });
    
  } catch (error) {
    console.error('Generic QR generation API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}

