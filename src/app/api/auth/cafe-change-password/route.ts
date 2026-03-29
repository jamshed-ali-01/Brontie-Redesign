import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import Merchant from '@/models/Merchant';

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword, email } = await request.json();

    if (!currentPassword || !newPassword || !email) {
      return NextResponse.json(
        { error: 'Current password, new password, and email are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find merchant by email
    const merchant = await Merchant.findOne({ 
      contactEmail: email.toLowerCase(),
      status: 'approved'
    });

    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found or not approved' },
        { status: 404 }
      );
    }

    // Verify current password (either temp password or actual password)
    let isValidPassword = false;
    if (merchant.tempPassword && currentPassword === merchant.tempPassword) {
      isValidPassword = true;
    } else if (merchant.password) {
      isValidPassword = await bcrypt.compare(currentPassword, merchant.password);
    }

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update merchant with new password and remove temp password and magic link
    await Merchant.findByIdAndUpdate(merchant._id, {
      password: hashedPassword,
      $unset: { 
        tempPassword: 1,
        magicLinkToken: 1,
        magicLinkExpires: 1
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
