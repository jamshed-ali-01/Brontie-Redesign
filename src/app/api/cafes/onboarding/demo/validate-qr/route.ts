import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import MerchantDemo from '@/models/MerchantDemo';
import Merchant from '@/models/Merchant';

export async function POST(request: NextRequest) {
  try {
    const { qrData, demoId } = await request.json();

    if (!qrData || !demoId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    // Robust check for demo ID (handles both full 24-char and visual 8-char IDs)
    const isTerminalData = qrData.startsWith('BRONTIE_DEMO_TERMINAL:');
    const matchesIdSuffix = qrData.endsWith(demoId);

    if (!isTerminalData || !matchesIdSuffix) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid QR code. Please scan the terminal QR on your desktop screen.' 
      }, { status: 400 });
    }

    // Mark as redeemed by full ID or short suffix
    let demo;
    if (demoId.length === 24) {
      demo = await MerchantDemo.findByIdAndUpdate(
        demoId,
        { status: 'redeemed' },
        { new: true }
      );
    } else {
      // Find and update by suffix if the ID is shortened (e.g. 8 characters)
      demo = await MerchantDemo.findOneAndUpdate(
        {
          $expr: {
            $regexMatch: {
              input: { $toString: "$_id" },
              regex: `${demoId}$`
            }
          }
        },
        { status: 'redeemed' },
        { new: true }
      );
    }

    if (!demo) {
      return NextResponse.json({ error: 'Demo session not found' }, { status: 404 });
    }

    // Success! Mark onboarding as complete for this merchant
    if (demo.merchantId) {
      await Merchant.findByIdAndUpdate(demo.merchantId, { signupStep: 8 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Voucher redeemed successfully!' 
    });

  } catch (error: any) {
    console.error('[Demo Scan API] Error:', error);
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
  }
}
