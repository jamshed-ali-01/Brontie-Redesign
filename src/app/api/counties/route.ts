import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Merchant from '@/models/Merchant';
import { IRELAND_COUNTIES } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const withActiveCafes = searchParams.get('withActiveCafes') === 'true';
    
    if (withActiveCafes) {
      // Get counties that have active cafes
      const activeMerchants = await Merchant.find({
        status: 'approved',
        isActive: true
      }).select('county');
      
      const countiesWithCafes = [...new Set(activeMerchants.map(m => m.county))];
      
      // Filter the full counties list to only include those with active cafes
      const availableCounties = IRELAND_COUNTIES.filter(county => 
        countiesWithCafes.includes(county)
      );
      
      return NextResponse.json({
        success: true,
        counties: availableCounties
      }, { status: 200 });
    }
    
    // Return all counties
    return NextResponse.json({
      success: true,
      counties: IRELAND_COUNTIES
    }, { status: 200 });
    
  } catch (error) {
    console.error('Counties API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch counties' },
      { status: 500 }
    );
  }
}

