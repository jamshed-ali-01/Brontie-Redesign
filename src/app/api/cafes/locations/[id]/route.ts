import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import jwt from "jsonwebtoken";
import MerchantLocation from '@/models/MerchantLocation';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("cafe-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret"
    ) as { merchantId: string };

    await connectToDatabase();

    const { id } = await params;
    const locationId = id;
    const merchantId = decoded.merchantId;

    const body = await request.json();

    // Check if it's a partial update for photoUrl only
    if (Object.keys(body).length === 1 && body.photoUrl !== undefined) {
      const location = await MerchantLocation.findOneAndUpdate(
        { _id: locationId, merchantId },
        { photoUrl: body.photoUrl, updatedAt: new Date() },
        { new: true }
      );

      if (!location) {
        return NextResponse.json(
          { error: 'Location not found or you do not have permission' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        location
      });
    }

    const {
      name,
      address,
      city,
      county,
      zipCode,
      country,
      phoneNumber,
      openingHours,
      accessibility,
      area,
      customArea,
    } = body;

    // Validation
    if (!name || !address || !county) {
      return NextResponse.json(
        { error: 'Name, address, and county are required' },
        { status: 400 }
      );
    }

    // Final area value (either from dropdown or custom)
    let finalArea = area;
    if (area === 'other') {
      finalArea = customArea;
    }

    const updateData = {
      name,
      address,
      city: city || '',
      county,
      area: finalArea || '',
      customArea: area === 'other' ? customArea : '',
      zipCode,
      country: country || 'Ireland',
      phoneNumber: phoneNumber || '',
      openingHours,
      accessibility,
      updatedAt: new Date()
    };

    const location = await MerchantLocation.findOneAndUpdate(
      { _id: locationId, merchantId },
      updateData,
      { new: true }
    );

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found or you do not have permission' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      location
    });

  } catch (error) {
    console.error('Error updating café location:', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("cafe-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret"
    ) as { merchantId: string };

    await connectToDatabase();

    const { id } = await params;
    const locationId = id;
    const merchantId = decoded.merchantId;

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
        { error: 'Location not found or you do not have permission' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Location deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting café location:', error);
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    );
  }
}