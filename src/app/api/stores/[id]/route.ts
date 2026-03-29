import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Merchant from '@/models/Merchant';
import GiftItem from '@/models/GiftItem';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id: merchantId } = await params;
    
    if (!merchantId) {
      return NextResponse.json(
        { error: 'Merchant ID is required' },
        { status: 400 }
      );
    }

    // Get merchant data (only approved merchants)
    const merchant = await Merchant.findOne({
      _id: merchantId,
      status: 'approved',
      isActive: true
    }).select('name description contactEmail contactPhone website logoUrl businessCategory address createdAt');

    if (!merchant) {
      return NextResponse.json(
        { error: 'Store not found or not available' },
        { status: 404 }
      );
    }

    // Get active gift items for this merchant
    const giftItems = await GiftItem.find({
      merchantId: merchantId,
      isActive: true
    }).select('name description price imageUrl categoryId createdAt');

    return NextResponse.json({
      success: true,
      store: merchant,
      giftItems: giftItems
    });

  } catch (error) {
    console.error('Error fetching store data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch store data' },
      { status: 500 }
    );
  }
}
