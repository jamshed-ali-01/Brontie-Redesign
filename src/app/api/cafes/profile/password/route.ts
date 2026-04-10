import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Merchant from '@/models/Merchant';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('cafe-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { merchantId: string };
    const merchantId = decoded.merchantId;

    if (!merchantId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters long' }, { status: 400 });
    }

    await connectToDatabase();
    const merchant = await Merchant.findById(merchantId);

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // If the merchant already has a password, they MUST provide the correct current password
    if (merchant.password || merchant.tempPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to set a new password' }, { status: 400 });
      }

      let isValidPassword = false;
      if (merchant.tempPassword && currentPassword === merchant.tempPassword) {
        isValidPassword = true;
      } else if (merchant.password) {
        isValidPassword = await bcrypt.compare(currentPassword, merchant.password);
      }

      if (!isValidPassword) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await Merchant.findByIdAndUpdate(merchantId, {
      password: hashedPassword,
      $unset: { 
        tempPassword: 1,
        magicLinkToken: 1,
        magicLinkExpires: 1
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Update password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
