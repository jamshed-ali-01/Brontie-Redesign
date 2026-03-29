import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Merchant from '@/models/Merchant';
import "@/models/MerchantLocation";
export async function GET() {
  try {
    await connectToDatabase();
    
    const merchants = await Merchant.find({})
      .select('name description logoUrl contactEmail county contactPhone website address status tags payoutDetails isActive brontieFeeSettings displayOrder createdAt updatedAt').populate({
        path: 'locations',
        select:
          'name address city area county zipCode country latitude longitude photoUrl phoneNumber openingHours accessibility',
        options: { sort: { name: 1 } },
      })
      .sort({ displayOrder:1 }); // Show newest first
    console.log(merchants)
    // Return merchants without locations for now to avoid complexity
    const merchantsData = merchants.map(merchant => ({
      _id: merchant._id,
      name: merchant.name,
      description: merchant.description,
      logoUrl: merchant.logoUrl,
      contactEmail: merchant.contactEmail,
      contactPhone: merchant.contactPhone,
      website: merchant.website,
      county: merchant.county || "",
      address: merchant.address,
      status: merchant.status,
      tags: merchant.tags,
      payoutDetails: merchant.payoutDetails,
      isActive: merchant.isActive,
      brontieFeeSettings: merchant.brontieFeeSettings,
      createdAt: merchant.createdAt,
      updatedAt: merchant.updatedAt,
      displayOrder: merchant.displayOrder,
      
      locations: merchant.locations || [] // ✅ add locations here
    }));
    
    return NextResponse.json({
      success: true,
      data: merchantsData
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching merchants:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch merchants',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { name, description, logoUrl, contactEmail, contactPhone, website, address } = body;
    
    if (!name || !contactEmail || !address) {
      return NextResponse.json(
        { error: 'Name, contact email, and address are required' },
        { status: 400 }
      );
    }
    
    // Check if merchant with same email exists
    const existingMerchant = await Merchant.findOne({ contactEmail: contactEmail.toLowerCase() });
    if (existingMerchant) {
      return NextResponse.json(
        { error: 'Merchant with this email already exists' },
        { status: 400 }
      );
    }
    
    const merchant = new Merchant({
      name,
      description: description || '',
      logoUrl: logoUrl || '',
      contactEmail: contactEmail.toLowerCase(),
      contactPhone: contactPhone || '',
      website: website || '',
      address,
      status: 'pending',
      tags: [],
      payoutDetails: {
        accountHolderName: '',
        iban: '',
        bic: ''
      },
      isActive: false // Start as inactive until approved
    });
    
    await merchant.save();
    
    return NextResponse.json({
      success: true,
      merchant
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating merchant:', error);
    return NextResponse.json(
      { error: 'Failed to create merchant' },
      { status: 500 }
    );
  }
}
