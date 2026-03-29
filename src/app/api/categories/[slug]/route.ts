import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Category from '@/models/Category';
import GiftItem from '@/models/GiftItem';
import Merchant from '@/models/Merchant';
import MerchantLocation from '@/models/MerchantLocation';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectToDatabase();
    
    // Ensure all models are registered with Mongoose
    // This forces JavaScript to evaluate these models before populate() is called
    void Merchant;
    void MerchantLocation;
    
    const { slug } = await params;
    
    // Find the category by slug and ensure it's active
    const category = await Category.findOne({ 
      slug: slug, 
      isActive: true 
    }).select('name slug description imageUrl displayOrder');
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Find gift items for this category from approved merchants only
    const giftItems = await GiftItem.find({ 
      categoryId: category._id,
      isActive: true 
    })
    .populate({
      path: 'merchantId',
      match: { status: 'approved' },
      select: 'name logoUrl status'
    })
    .populate('locationIds', 'name address')
    .select('name description price imageUrl merchantId locationIds')
    .sort({ name: 1 });

    // Filter out items from non-approved merchants
    const approvedGiftItems = giftItems.filter(item => item.merchantId && item.merchantId.status === 'approved');

    // Get all approved merchants for this category for the filter
    const merchants = await Merchant.find({ 
      status: 'approved',
      _id: { $in: approvedGiftItems.map(item => item.merchantId._id) }
    }).select('name logoUrl');
    
    // Create response with proper UTF-8 encoding
    const response = NextResponse.json({
      success: true,
      category,
      giftItems: approvedGiftItems,
      merchants
    });
    
    // Set proper headers for UTF-8 encoding
    response.headers.set('Content-Type', 'application/json; charset=utf-8');
    
    return response;
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}
