import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Merchant from '@/models/Merchant';
import GiftItem from '@/models/GiftItem';
import { sendMerchantApprovalEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {

    // Connect to database
    await connectToDatabase();

    // Find the merchant
    const merchant = await Merchant.findById(id);
    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    if (merchant.status !== 'pending') {
      return NextResponse.json(
        { error: 'Merchant is not pending approval' },
        { status: 400 }
      );
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');

    // Update merchant status and add temp password
    merchant.status = 'approved';
    merchant.isActive = true;
    merchant.tempPassword = tempPassword;
    
    // Add some default tags based on location (you can enhance this logic)
    const address = merchant.address.toLowerCase();
    if (address.includes('dublin')) {
      merchant.tags.push('region:dublin');
    } else if (address.includes('kildare')) {
      merchant.tags.push('region:kildare');
    } else if (address.includes('cork')) {
      merchant.tags.push('region:cork');
    } else if (address.includes('galway')) {
      merchant.tags.push('region:galway');
    }
    
    // Add collection tags based on gift items
    const giftItems = await GiftItem.find({ merchantId: merchant._id });
    const prices = giftItems.map(item => item.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    if (minPrice <= 10) {
      merchant.tags.push('collection:under-10');
    }
    if (maxPrice >= 20) {
      merchant.tags.push('collection:premium');
    }
    
    // Check if they have coffee items (using categoryId)
    const coffeeCategoryId = '68483ef21d38b4b7195d45cd'; // Cafés & Treats
    const hasCoffee = giftItems.some(item => item.categoryId.toString() === coffeeCategoryId);
    if (hasCoffee) {
      merchant.tags.push('collection:coffee');
    }
    
    // Check if they have food items (using categoryId)
    const foodCategoryId = '68492e4c7c523741d619abeb'; // Dining & Meals
    const hasFood = giftItems.some(item => item.categoryId.toString() === foodCategoryId);
    if (hasFood) {
      merchant.tags.push('collection:food');
    }

    await merchant.save();

    // Activate all gift items for this merchant
    await GiftItem.updateMany(
      { merchantId: merchant._id },
      { isActive: true }
    );

    // Send approval email
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const loginUrl = `${baseUrl}/cafes/login`;
      
      console.log('Sending approval email to:', merchant.contactEmail);
      console.log('Email data:', { name: merchant.name, tempPassword, loginUrl });
      
      await sendMerchantApprovalEmail(merchant.contactEmail, {
        name: merchant.name,
        tempPassword,
        loginUrl
      });
      
      console.log('Approval email sent successfully');
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
      // Don't fail the approval if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Merchant approved successfully',
      merchant: {
        id: merchant._id,
        name: merchant.name,
        status: merchant.status,
        tempPassword
      }
    });

  } catch (error) {
    console.error('Error approving merchant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
