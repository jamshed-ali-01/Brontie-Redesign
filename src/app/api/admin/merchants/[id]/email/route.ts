import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Merchant from '@/models/Merchant';
import { getAuthUser } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check for admin authentication
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = await params;
    const { contactEmail } = await request.json();

    if (!contactEmail || !contactEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // Check if email is already in use by another merchant
    const existingMerchant = await Merchant.findOne({
      contactEmail,
      _id: { $ne: id }
    });

    if (existingMerchant) {
      return NextResponse.json(
        { error: 'Email address is already in use' },
        { status: 400 }
      );
    }

    const merchant = await Merchant.findByIdAndUpdate(
      id,
      { contactEmail },
      { new: true }
    );

    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      merchant: {
        _id: merchant._id,
        name: merchant.name,
        contactEmail: merchant.contactEmail,
        status: merchant.status,
        isActive: merchant.isActive
      }
    });
  } catch (error) {
    console.error('Error updating merchant email:', error);
    return NextResponse.json(
      { error: 'Failed to update email' },
      { status: 500 }
    );
  }
}
