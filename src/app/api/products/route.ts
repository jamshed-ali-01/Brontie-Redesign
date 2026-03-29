import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import GiftItem from '@/models/GiftItem';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get query parameters
    const categorySlug = request.nextUrl.searchParams.get('category');
    const merchantId = request.nextUrl.searchParams.get('merchant');
    const locationId = request.nextUrl.searchParams.get('location');
    
    // Build query object
    const query: Record<string, string | boolean | { $in: string[] }> = { isActive: true };
    
    if (categorySlug) {
      // Find category by slug first
      const Category = (await import('@/models/Category')).default;
      const category = await Category.findOne({ slug: categorySlug, isActive: true });
      if (category) {
        query.categoryId = category._id;
      }
    }
    
    if (merchantId && mongoose.Types.ObjectId.isValid(merchantId)) {
      query.merchantId = merchantId;
    }
    
    if (locationId && mongoose.Types.ObjectId.isValid(locationId)) {
      query.locationIds = { $in: [locationId] };
    }
    
    const giftItems = await GiftItem.find(query)
      .populate('merchantId', 'name')
      .populate('locationIds', 'name address');
    
    return NextResponse.json({ giftItems }, { status: 200 });
  } catch (error) {
    console.error('Error fetching gift items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gift items' },
      { status: 500 }
    );
  }
}
  