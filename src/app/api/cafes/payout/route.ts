import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Merchant from '@/models/Merchant';
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

    // Get merchant payout details
    const merchant = await Merchant.findById(merchantId).select('payoutDetails');
    
    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(merchant.payoutDetails || {});

  } catch (error) {
    console.error('Get payout details error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const { accountHolderName, iban, bic } = body;

    // Validation
    if (!accountHolderName || !iban) {
      return NextResponse.json(
        { error: 'Account holder name and IBAN are required' },
        { status: 400 }
      );
    }

    // Basic IBAN validation (you can add more sophisticated validation)
    if (iban.length < 15 || iban.length > 34) {
      return NextResponse.json(
        { error: 'Invalid IBAN format' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Update merchant payout details
    const updatedMerchant = await Merchant.findByIdAndUpdate(
      merchantId,
      {
        payoutDetails: {
          accountHolderName,
          iban: iban.toUpperCase(),
          bic: bic || ''
        }
      },
      { new: true, runValidators: true }
    ).select('payoutDetails');

    if (!updatedMerchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payoutDetails: updatedMerchant.payoutDetails
    });

  } catch (error) {
    console.error('Update payout details error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
