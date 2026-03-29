import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Report from '@/models/Report';
import { getAuthUser } from '@/lib/auth';
import mongoose from 'mongoose';

// GET /api/admin/reports/[id] - Get a specific report with PDF
export async function GET(
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 });
    }

    const report = await Report.findById(id)
      .populate('merchantId', 'name contactEmail')
      .lean();

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Return PDF as response
    return new NextResponse(report.pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${report.fileName}"`,
      },
    });

  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

