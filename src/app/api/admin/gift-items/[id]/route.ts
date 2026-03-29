import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import GiftItem from '@/models/GiftItem';
import Category from '@/models/Category';
import Merchant from '@/models/Merchant';
import MerchantLocation from '@/models/MerchantLocation';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    const body = await request.json();
    const { name, description, price, imageUrl, categoryId, merchantId, locationIds, isActive } = body;
    
    if (!name || !description || !price || !categoryId || !merchantId) {
      return NextResponse.json(
        { error: 'Name, description, price, category, and merchant are required' },
        { status: 400 }
      );
    }
    
    // Verify merchant exists
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 400 }
      );
    }
    
    // Verify category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 400 }
      );
    }
    
    // Verify locations belong to the merchant
    if (locationIds && locationIds.length > 0) {
      const locations = await MerchantLocation.find({
        _id: { $in: locationIds },
        merchantId
      });
      
      if (locations.length !== locationIds.length) {
        return NextResponse.json(
          { error: 'One or more locations are invalid or do not belong to the merchant' },
          { status: 400 }
        );
      }
    }
    
    // Check if another gift item with same name exists for this merchant
    const existingGiftItem = await GiftItem.findOne({ 
      name, 
      merchantId,
      _id: { $ne: id } 
    });
    if (existingGiftItem) {
      return NextResponse.json(
        { error: 'Gift item with this name already exists for this merchant' },
        { status: 400 }
      );
    }
    
    const giftItem = await GiftItem.findByIdAndUpdate(
      id,
      {
        name,
        description,
        price: parseFloat(price),
        imageUrl: imageUrl || '',
        categoryId,
        merchantId,
        locationIds: locationIds || [],
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('categoryId', 'name')
     .populate('merchantId', 'name')
     .populate('locationIds', 'name');
    
    if (!giftItem) {
      return NextResponse.json(
        { error: 'Gift item not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      giftItem
    });
    
  } catch (error) {
    console.error('Error updating gift item:', error);
    return NextResponse.json(
      { error: 'Failed to update gift item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    
    // Check if gift item has associated vouchers
    const { default: Voucher } = await import('@/models/Voucher');
    const voucherCount = await Voucher.countDocuments({ giftItemId: id });
    
    if (voucherCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete gift item. It has ${voucherCount} associated vouchers.` },
        { status: 400 }
      );
    }
    
    const giftItem = await GiftItem.findByIdAndDelete(id);
    
    if (!giftItem) {
      return NextResponse.json(
        { error: 'Gift item not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Gift item deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting gift item:', error);
    return NextResponse.json(
      { error: 'Failed to delete gift item' },
      { status: 500 }
    );
  }
}
