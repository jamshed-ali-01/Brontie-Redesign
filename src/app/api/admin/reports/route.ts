import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Report from '@/models/Report';
import { getAuthUser } from '@/lib/auth';

// GET /api/admin/reports - Get all reports
export async function GET(request: NextRequest) {
  try {
    // Check for admin authentication
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Build query
    const query: any = {};
    if (merchantId) {
      query.merchantId = merchantId;
    }

    // Fetch reports with merchant details
    const reports = await Report.find(query)
      .populate('merchantId', 'name contactEmail')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('-pdfBuffer') // Don't send PDF buffer in list
      .lean();

    // Get total count
    const total = await Report.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: reports,
      total,
      limit,
      skip
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

