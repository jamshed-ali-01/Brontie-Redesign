import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import GiftItem from '@/models/GiftItem';
import mongoose from 'mongoose';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid merchant ID' }, { status: 400 });
    }

    const { items } = await request.json();
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const updatePromises = items.map((item: any) =>
      GiftItem.findByIdAndUpdate(item._id, { itemDisplayOrder: item.itemDisplayOrder })
    );

    await Promise.all(updatePromises);
    return NextResponse.json({ success: true, message: 'Gift item order updated' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: 'Failed to update gift items' }, { status: 500 });
  }
}
