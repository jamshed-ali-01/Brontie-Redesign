import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import GiftItem from '@/models/GiftItem';
import Merchant from '@/models/Merchant';
import Category from '@/models/Category';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('cafe-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { merchantId: string };
    const merchantId = decoded.merchantId;

    await connectToDatabase();
    const items = await GiftItem.find({ merchantId });

    return NextResponse.json({ success: true, items });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('cafe-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { merchantId: string };
    const merchantId = decoded.merchantId;

    await connectToDatabase();

    const body = await request.json();
    const { item, skip, isFinal } = body;

    // 1. Handle Skip or Final Step Advancement
    if (skip || isFinal) {
      await Merchant.findByIdAndUpdate(merchantId, { signupStep: 4 });
      return NextResponse.json({ success: true, message: 'Onboarding step advanced' });
    }

    // 2. Handle Individual Item Save/Update
    if (!item) {
      return NextResponse.json({ error: 'No item provided' }, { status: 400 });
    }

    // Get or create default category
    let category = await Category.findOne({ name: 'Coffee' });
    if (!category) category = await Category.findOne({});
    if (!category) {
      category = await Category.create({ 
        name: 'Menu', 
        slug: 'menu', 
        displayOrder: 1,
        isActive: true
      });
    }

    let savedItem;
    // Check if it's an update (has a mongo _id) or a new item
    if (item.dbId) {
      savedItem = await GiftItem.findByIdAndUpdate(item.dbId, {
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        categoryId: category._id,
      }, { new: true });
    } else {
      savedItem = new GiftItem({
        merchantId,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        categoryId: category._id,
        isActive: true
      });
      await savedItem.save();
    }

    return NextResponse.json({ 
       success: true, 
       message: 'Item saved successfully',
       item: savedItem
    });

  } catch (error) {
    console.error('Save item error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('cafe-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { merchantId: string };
    const merchantId = decoded.merchantId;

    const { id } = await request.json();
    await connectToDatabase();
    
    // Ensure the item belongs to the merchant
    await GiftItem.findOneAndDelete({ _id: id, merchantId });

    return NextResponse.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
