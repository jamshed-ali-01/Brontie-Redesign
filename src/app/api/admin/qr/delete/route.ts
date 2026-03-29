import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import QRCode from '@/models/QRCode';

export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const updated = await QRCode.findByIdAndUpdate(id, { isActive: false });
    if (!updated) {
      return NextResponse.json({ error: 'QR code not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Merchant QR delete API error:', error);
    return NextResponse.json({ error: 'Failed to delete QR code' }, { status: 500 });
  }
}


