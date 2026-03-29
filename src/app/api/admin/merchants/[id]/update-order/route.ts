import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Merchant from '@/models/Merchant';
import mongoose from 'mongoose';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid merchant ID' }, { status: 400 });
    }

    const { displayOrder } = await request.json();
    if (displayOrder === undefined) {
      return NextResponse.json({ success: false, error: 'Missing displayOrder' }, { status: 400 });
    }

    await Merchant.findByIdAndUpdate(id, { displayOrder });
    return NextResponse.json({ success: true, message: 'Merchant order updated' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: 'Failed to update merchant order' }, { status: 500 });
  }
}
