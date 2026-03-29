import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import GenericQRCode from '@/models/GenericQRCode';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    // Build query
    const query: any = {};
    if (type && ['homepage', 'products', 'custom'].includes(type)) {
      query.type = type;
    }
    
    // Get all generic QR codes
    const qrCodes = await GenericQRCode.find(query)
      .sort({ createdAt: -1 })
      .limit(100);
    
    return NextResponse.json({
      success: true,
      qrCodes
    }, { status: 200 });
    
  } catch (error) {
    console.error('Generic QR list API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch QR codes' },
      { status: 500 }
    );
  }
}

