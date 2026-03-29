import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Voucher from '@/models/Voucher';
import GiftItem from '@/models/GiftItem';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { giftItemId, recipientName, senderName } = body;
    
    // Validate required fields
    if (!giftItemId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: giftItemId' },
        { status: 400 }
      );
    }
    
    // Verify gift item exists and get its valid locations
    const giftItem = await GiftItem.findById(giftItemId).populate('locationIds');
    if (!giftItem) {
      return NextResponse.json(
        { success: false, error: 'Gift item not found' },
        { status: 404 }
      );
    }
    
    if (!giftItem.isActive) {
      return NextResponse.json(
        { success: false, error: 'Gift item is not available' },
        { status: 400 }
      );
    }
    
    // Generate a unique redemption code
    const redemptionLink = nanoid(10);
    
    // Create a new voucher
    const voucher = await Voucher.create({
      giftItemId,
      recipientName,
      senderName,
      redemptionLink,
      status: 'unredeemed',
      expiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000), // 5 years from now
      validLocationIds: giftItem.locationIds,
    });
    
    return NextResponse.json({ 
      success: true,
      voucher: {
        _id: voucher._id,
        redemptionLink: redemptionLink
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating voucher:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create voucher' },
      { status: 500 }
    );
  }
}
