import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import MerchantDemo from '@/models/MerchantDemo';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();
    
    // Find the demo voucher by full ID or short suffix
    let demo;
    if (id.length === 24) {
      demo = await MerchantDemo.findById(id).select('status');
    } else {
      // Find by suffix if the ID is shortened (e.g. 8 characters)
      demo = await MerchantDemo.findOne({
        $expr: {
          $regexMatch: {
            input: { $toString: "$_id" },
            regex: `${id}$`
          }
        }
      }).select('status');
    }

    if (!demo) return NextResponse.json({ error: 'Demo not found' }, { status: 404 });

    return NextResponse.json({ success: true, status: demo.status });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
