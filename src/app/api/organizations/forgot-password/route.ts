// src\app\api\organizations\forgot-password\route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Organization from '@/models/Organization';
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

    // Find the organization by email
    const organization = await Organization.findOne({ email: email.toLowerCase() });

    if (!organization) {
      console.log(`No organization found with email: ${email}`);
      return NextResponse.json(
        { 
          emailFound: false,
          message: 'No organization account found with this email.'
        },
        { status: 200 }
      );
    }

    // Check if organization has email
    if (!organization.email) {
      return NextResponse.json(
        { 
          emailFound: false,
          message: 'No organization account found with this email.'
        },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to organization
    organization.resetPasswordToken = resetToken;
    organization.resetPasswordExpires = resetTokenExpiry;
    await organization.save();

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/organizations/reset-password?token=${resetToken}`;

    // Send email
    const emailSubject = 'Reset Your Brontie Organization Password';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/brontie-logo.webp" alt="Brontie" style="height: 60px;">
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #2d3748; margin-bottom: 20px; text-align: center;">Organization Password Reset Request</h2>
          
          <p style="color: #4a5568; line-height: 1.6; margin-bottom: 20px;">
            Hello ${organization.name},
          </p>
          
          <p style="color: #4a5568; line-height: 1.6; margin-bottom: 20px;">
            We received a request to reset your password for your Brontie organization account. 
            If you made this request, click the button below to reset your password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Reset My Password
            </a>
          </div>
          
          <p style="color: #4a5568; line-height: 1.6; margin-bottom: 20px;">
            If the button doesn't work, you can copy and paste this link into your browser:
          </p>
          
          <p style="color: #2563eb; word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 5px; font-size: 14px;">
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
          <p>This email was sent from Brontie - Organization Portal</p>
          <p>If you have any questions, contact us at organizations@brontie.com</p>
        </div>
      </div>
    `;

    const emailText = `
      Organization Password Reset Request
      
      Hello ${organization.name},
      
      We received a request to reset your password for your Brontie organization account.
      If you made this request, click the link below to reset your password:
      
      ${resetUrl}
      
      This link will expire in 1 hour for security reasons.
      
      If you didn't request a password reset, you can safely ignore this email.
      Your password will remain unchanged.
      
      Best regards,
      The Brontie Organization Team
    `;

    await sendEmail({
      to: organization.email,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
    });

    console.log(`Password reset email sent to organization: ${organization.name} (${organization.email})`);

    return NextResponse.json(
      { 
        emailFound: true,
        message: 'Password reset link has been sent to your email.'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in organization forgot password:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}