import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import GiftItem from '@/models/GiftItem';
import Merchant from '@/models/Merchant';
import MerchantLocation from '@/models/MerchantLocation';
import Category from '@/models/Category';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    // Ensure all models are registered
    void Merchant;
    void MerchantLocation;
    void Category;
    
    const { id } = await params;
    
    // Find the gift item by ID
    const giftItem = await GiftItem.findById(id)
      .populate('merchantId', 'name logoUrl contactEmail')
      .populate('locationIds', 'name address');
    
    if (!giftItem || !giftItem.isActive) {
      return NextResponse.json(
        { success: false, error: 'Gift item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      giftItem
    });

  } catch (error) {
    console.error('Error fetching gift item:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
