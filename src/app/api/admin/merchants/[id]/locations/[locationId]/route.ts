import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import MerchantLocation, { IOpeningHours, IAccessibility } from '@/models/MerchantLocation';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; locationId: string }> }
) {
  try {
    await connectToDatabase();

    const { id, locationId } = await params;
    const merchantId = id;

    // Check if location has associated vouchers
    const { default: Voucher } = await import('@/models/Voucher');
    const voucherCount = await Voucher.countDocuments({ locationId });

    if (voucherCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete location. It has ${voucherCount} associated vouchers.` },
        { status: 400 }
      );
    }

    const location = await MerchantLocation.findOneAndDelete({
      _id: locationId,
      merchantId
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Location deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting merchant location:', error);
    return NextResponse.json(
      { error: 'Failed to delete merchant location' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; locationId: string }> }
) {
  try {
    await connectToDatabase();

    const { id, locationId } = await params;
    const merchantId = id;
    const body = await request.json();
    const {
      name,
      address,
      city,
      county,
      zipCode,
      country,
      latitude,
      longitude,
      photoUrl,
      phoneNumber,
      openingHours,
      accessibility,
      area,
      customArea
    } = body;

    if (!name || !address || !county) {
      return NextResponse.json(
        { error: 'Name, address, and county are required' },
        { status: 400 }
      );
    }

    const updateData: Partial<{
      name: string;
      address: string;
      city?: string;
      county: string;
      area?: string;
      customArea?: string;
      zipCode: string;
      country: string;
      latitude?: number;
      longitude?: number;
      photoUrl?: string;
      phoneNumber?: string;
      openingHours?: IOpeningHours;
      accessibility?: IAccessibility;
    }> = {
      name,
      address,
      city: city || '',
      county,
      zipCode,
      area,
      customArea,
      country: country || 'Ireland'
    };

    // Add optional fields if provided
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (openingHours !== undefined) updateData.openingHours = openingHours;
    if (accessibility !== undefined) updateData.accessibility = accessibility;

    const location = await MerchantLocation.findOneAndUpdate(
      { _id: locationId, merchantId },
      updateData,
      { new: true }
    );

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      location
    });

  } catch (error) {
    console.error('Error updating merchant location:', error);
    return NextResponse.json(
      { error: 'Failed to update merchant location' },
      { status: 500 }
    );
  }
}
