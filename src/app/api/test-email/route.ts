import { NextRequest, NextResponse } from 'next/server';
import { sendPaymentSuccessEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Test data for payment success email
    const testVoucherData = {
      giftItemId: {
        name: 'Test Coffee Gift',
        price: 5.50,
        merchantId: {
          name: 'Test Coffee Shop'
        }
      },
      senderName: 'Test Sender',
      recipientName: 'Test Recipient',
      redemptionLink: 'test123456',
      status: 'unredeemed'
    };

    const emailSent = await sendPaymentSuccessEmail(email, [testVoucherData]);

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: 'Test payment success email sent successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send test email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 