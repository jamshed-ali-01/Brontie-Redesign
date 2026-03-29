import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Merchant from '@/models/Merchant';
import { sendMerchantDenialEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { reason } = await request.json();

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

    // Update merchant status
    merchant.status = 'denied';
    merchant.isActive = false;
    await merchant.save();

    // Send denial email
    try {
      console.log('Sending denial email to:', merchant.contactEmail);
      console.log('Email data:', { name: merchant.name, reason });
      
      await sendMerchantDenialEmail(merchant.contactEmail, {
        name: merchant.name,
        reason
      });
      
      console.log('Denial email sent successfully');
    } catch (emailError) {
      console.error('Failed to send denial email:', emailError);
      // Don't fail the denial if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Merchant denied successfully',
      merchant: {
        id: merchant._id,
        name: merchant.name,
        status: merchant.status
      }
    });

  } catch (error) {
    console.error('Error denying merchant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
