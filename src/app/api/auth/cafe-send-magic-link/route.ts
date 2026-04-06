import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Merchant from '@/models/Merchant';
import { sendMerchantSignupEmail } from '@/lib/email';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Find merchant
    const merchant = await Merchant.findOne({ 
      contactEmail: email.toLowerCase(),
      status: 'approved' 
    });

    if (!merchant) {
      return NextResponse.json({ 
        error: 'No account found with this email.' 
      }, { status: 404 });
    }

    // Generate token
    const token = nanoid(32);
    // Persistent magic link until password set

    merchant.magicLinkToken = token;
    merchant.magicLinkExpires = undefined; 
    await merchant.save();

    // Send the email
    await sendMerchantSignupEmail(merchant.contactEmail, {
      name: merchant.name,
      email: merchant.contactEmail,
      magicLinkToken: token
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Sign-in link sent! Please check your email.' 
    });

  } catch (error) {
    console.error('Send magic link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
