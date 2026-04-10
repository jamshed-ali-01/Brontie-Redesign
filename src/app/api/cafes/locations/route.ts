import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import jwt from "jsonwebtoken";
import MerchantLocation from '@/models/MerchantLocation';

export async function GET(request: NextRequest) {
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

    const merchantId = decoded.merchantId;

    const locations = await MerchantLocation.find({ merchantId })
      .select('name address city county area customArea zipCode country phoneNumber openingHours accessibility isActive photoUrl createdAt updatedAt')
      .sort({ name: 1 });

    return NextResponse.json({
      success: true,
      locations
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching café locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("cafe-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret"
    ) as { merchantId: string };
    const merchantId = decoded.merchantId;
    const body = await request.json();

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

    const location = new MerchantLocation({
      merchantId,
      name,
      address,
      city: city || '',
      county,
      area: finalArea || '',
      customArea: area === 'other' ? customArea : undefined,
      zipCode,
      country: country || 'Ireland',
      phoneNumber: phoneNumber || '',
      openingHours: openingHours || {
        monday: { open: '09:00', close: '17:00', closed: false },
        tuesday: { open: '09:00', close: '17:00', closed: false },
        wednesday: { open: '09:00', close: '17:00', closed: false },
        thursday: { open: '09:00', close: '17:00', closed: false },
        friday: { open: '09:00', close: '17:00', closed: false },
        saturday: { open: '09:00', close: '17:00', closed: false },
        sunday: { open: '09:00', close: '17:00', closed: true }
      },
      accessibility: accessibility || {
        wheelchairAccessible: false,
        childFriendly: false,
        petFriendly: false,
        parkingAvailable: false,
        wifiAvailable: false,
        outdoorSeating: false,
        deliveryAvailable: false,
        takeawayAvailable: false,
        reservationsRequired: false,
        smokingAllowed: false
      },
      isActive: true
    });

    await location.save();

    // Increment merchant signupStep if it's currently 2
    const Merchant = (await import('@/models/Merchant')).default;
    const merchant = await Merchant.findById(merchantId);
    if (merchant && merchant.signupStep === 2) {
      merchant.signupStep = 3;
      await merchant.save();
    }

    return NextResponse.json({
      success: true,
      location
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating café location:', error);
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    );
  }
}