import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import GiftItem from '@/models/GiftItem';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Get merchant ID from JWT token
    const token = request.cookies.get('cafe-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { merchantId: string };
    const merchantId = decoded.merchantId;

    if (!merchantId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Get all gift items for this merchant
    const giftItems = await GiftItem.find({ 
      merchantId,
      isActive: true 
    }).sort({ createdAt: -1 });

    return NextResponse.json(giftItems);

  } catch (error) {
    console.error('Get gift items error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get merchant ID from JWT token
    const token = request.cookies.get('cafe-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { merchantId: string };
    const merchantId = decoded.merchantId;

    if (!merchantId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, categoryId, price, description, imageUrl } = body;

    // Validation
    if (!name || !categoryId || !price) {
      return NextResponse.json(
        { error: 'Name, category, and price are required' },
        { status: 400 }
      );
    }

    if (price < 0.50) {
      return NextResponse.json(
        { error: 'Price must be at least €0.50' },
        { status: 400 }
      );
    }

    // Check if price is in €0.10 increments (handle floating point precision issues)
    const roundedPrice = Math.round(price * 100) / 100; // Round to 2 decimal places
    const remainder = Math.round((roundedPrice * 100) % 10); // Get remainder in cents
    if (remainder !== 0) {
      return NextResponse.json(
        { error: 'Price must be in €0.10 increments' },
        { status: 400 }
      );
    }

    if (description && description.length > 200) {
      return NextResponse.json(
        { error: 'Description must be 200 characters or less' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if merchant already has 15 items
    const existingItemsCount = await GiftItem.countDocuments({ 
      merchantId,
      isActive: true 
    });

    if (existingItemsCount >= 15) {
      return NextResponse.json(
        { error: 'You can only have up to 15 items. Please remove some items before adding new ones.' },
        { status: 400 }
      );
    }

    // Create new gift item
    const newGiftItem = new GiftItem({
      merchantId,
      name,
      categoryId,
      price,
      description,
      imageUrl,
      isActive: true
    });

    await newGiftItem.save();

    return NextResponse.json({
      success: true,
      giftItem: newGiftItem
    }, { status: 201 });

  } catch (error) {
    console.error('Create gift item error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
