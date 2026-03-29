import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import GiftItem from '@/models/GiftItem';
import jwt from 'jsonwebtoken';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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

    // Update gift item (ensure it belongs to this merchant)
    const updatedGiftItem = await GiftItem.findOneAndUpdate(
      { _id: id, merchantId },
      {
        name,
        categoryId,
        price,
        description,
        imageUrl
      },
      { new: true, runValidators: true }
    );

    if (!updatedGiftItem) {
      return NextResponse.json(
        { error: 'Gift item not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      giftItem: updatedGiftItem
    });

  } catch (error) {
    console.error('Update gift item error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
        { status: 500 }
      );
    }

    await connectToDatabase();

    // Soft delete gift item (set isActive to false)
    const deletedGiftItem = await GiftItem.findOneAndUpdate(
      { _id: id, merchantId },
      { isActive: false },
      { new: true }
    );

    if (!deletedGiftItem) {
      return NextResponse.json(
        { error: 'Gift item not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Gift item deleted successfully'
    });

  } catch (error) {
    console.error('Delete gift item error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
