import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Merchant from '@/models/Merchant';
import { getAuthUser } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export async function POST(
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
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    const merchant = await Merchant.findById(id);

    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Generate temporary password
    const temporaryPassword = crypto.randomBytes(8).toString('hex');
    
    // Hash the temporary password before storing
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

    // Update merchant with hashed password in the MAIN password field
    merchant.password = hashedPassword; // This is the field used for login
    merchant.tempPassword = temporaryPassword; // Store plain text temporarily for email
    await merchant.save();

    // Send email with temporary password
    const emailSubject = 'Temporary Password - Brontie Café Platform';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Brontie</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Café Gifting Platform</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Temporary Password</h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            Hello ${merchant.name},
          </p>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            Your admin has requested a temporary password for your Brontie café account. Please use the following credentials to log in:
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #14b8a6; margin: 20px 0;">
            <p style="margin: 0; color: #1f2937;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0 0 0; color: #1f2937;"><strong>Temporary Password:</strong> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${temporaryPassword}</code></p>
          </div>
          
          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>⚠️ Important:</strong> Please change this temporary password immediately after logging in for security reasons.
            </p>
          </div>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            You can log in to your café dashboard at: <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.brontie.ie'}/cafes/login" style="color: #14b8a6; text-decoration: none;">${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.brontie.ie'}/cafes/login</a>
          </p>
          
          <p style="color: #4b5563; line-height: 1.6;">
            If you have any questions, please contact our support team.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Best regards,<br>
              The Brontie Team
            </p>
          </div>
        </div>
      </div>
    `;

    const emailText = `
      Temporary Password - Brontie Café Platform
      
      Hello ${merchant.name},
      
      Your admin has requested a temporary password for your Brontie café account.
      
      Email: ${email}
      Temporary Password: ${temporaryPassword}
      
      IMPORTANT: Please change this temporary password immediately after logging in.
      
      Login at: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.brontie.ie'}/cafes/login
      
      Best regards,
      The Brontie Team
    `;

    await sendEmail({
      to: email,
      subject: emailSubject,
      html: emailHtml,
      text: emailText
    });

    // Clear the plain text temporary password from database after sending email
    merchant.tempPassword = undefined;
    await merchant.save();

    return NextResponse.json({
      success: true,
      message: 'Temporary password sent successfully'
    });
  } catch (error) {
    console.error('Error sending temporary password:', error);
    return NextResponse.json(
      { error: 'Failed to send temporary password' },
      { status: 500 }
    );
  }
}