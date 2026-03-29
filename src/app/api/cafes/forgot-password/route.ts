import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Merchant from '@/models/Merchant';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find the merchant by email
    const merchant = await Merchant.findOne({ contactEmail: email.toLowerCase() });

    if (!merchant) {
      // Don't reveal if email exists or not for security
      return NextResponse.json(
        { message: 'If an account with that email exists, we have sent a password reset link.' },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to merchant
    await Merchant.findByIdAndUpdate(merchant._id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetTokenExpiry,
    });

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/cafes/reset-password?token=${resetToken}`;

    // Send email
    const emailSubject = 'Reset Your Brontie Café Password';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/brontie-logo.webp" alt="Brontie" style="height: 60px;">
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #2d3748; margin-bottom: 20px; text-align: center;">Password Reset Request</h2>
          
          <p style="color: #4a5568; line-height: 1.6; margin-bottom: 20px;">
            Hello ${merchant.name},
          </p>
          
          <p style="color: #4a5568; line-height: 1.6; margin-bottom: 20px;">
            We received a request to reset your password for your Brontie café account. 
            If you made this request, click the button below to reset your password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #0d9488; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Reset My Password
            </a>
          </div>
          
          <p style="color: #4a5568; line-height: 1.6; margin-bottom: 20px;">
            If the button doesn't work, you can copy and paste this link into your browser:
          </p>
          
          <p style="color: #0d9488; word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 5px; font-size: 14px;">
            ${resetUrl}
          </p>
          
          <p style="color: #4a5568; line-height: 1.6; margin-top: 20px;">
            This link will expire in 1 hour for security reasons.
          </p>
          
          <p style="color: #4a5568; line-height: 1.6; margin-top: 20px;">
            If you didn't request a password reset, you can safely ignore this email. 
            Your password will remain unchanged.
          </p>
        </div>
        
        <div style="text-align: center; color: #718096; font-size: 14px;">
          <p>This email was sent from Brontie - Your Gift Platform</p>
          <p>If you have any questions, contact us at support@brontie.com</p>
        </div>
      </div>
    `;

    const emailText = `
      Password Reset Request
      
      Hello ${merchant.name},
      
      We received a request to reset your password for your Brontie café account.
      If you made this request, click the link below to reset your password:
      
      ${resetUrl}
      
      This link will expire in 1 hour for security reasons.
      
      If you didn't request a password reset, you can safely ignore this email.
      Your password will remain unchanged.
      
      Best regards,
      The Brontie Team
    `;

    await sendEmail({
      to: merchant.contactEmail,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
    });

    return NextResponse.json(
      { message: 'If an account with that email exists, we have sent a password reset link.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in forgot password:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}
