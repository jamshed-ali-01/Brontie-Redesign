import { NextRequest, NextResponse } from 'next/server';
import { generateCafeReport } from '@/lib/pdf-report-generator';
import { sendEmail } from '@/lib/email';
import { connectToDatabase } from '@/lib/mongodb';
import Merchant from '@/models/Merchant';
import Report from '@/models/Report';
import { getAuthUser } from '@/lib/auth';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    // Check for admin authentication using cookies
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { merchantId, testEmail } = await request.json();
    
    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Get merchant details
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    console.log(`Generating test report for ${merchant.name}...`);

    // Generate PDF report
    const { buffer: pdfBuffer, invoiceNumber, reportPeriod } = await generateCafeReport(merchantId);
    
    // Determine recipient email
    const today = new Date();
    const recipientEmail = testEmail || merchant.contactEmail;
    const fileName = `TEST-brontie-report-${merchant.name.replace(/[^a-zA-Z0-9]/g, '-')}-${today.toISOString().split('T')[0]}.pdf`;
    
    // Save report to database
    const report = new Report({
      merchantId: new mongoose.Types.ObjectId(merchantId),
      invoiceNumber: invoiceNumber,
      reportPeriod: reportPeriod,
      pdfBuffer: pdfBuffer,
      fileName: fileName,
      emailSent: false, // Will update after sending
      recipientEmail: recipientEmail
    });
    
    await report.save();
    
    // Prepare email content
    const reportDate = today.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const nextFriday = new Date();
    const currentDay = nextFriday.getDay();
    let daysUntilFriday = 5 - currentDay;
    if (daysUntilFriday <= 0) daysUntilFriday += 7;
    nextFriday.setDate(today.getDate() + daysUntilFriday);

    const emailSubject = `[TEST] Brontie Weekly Report - ${merchant.name} (${reportDate})`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Brontie Weekly Report - TEST</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #14b8a6, #0d9488); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
          .test-banner { background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; border-radius: 6px; margin-bottom: 20px; text-align: center; font-weight: bold; }
          .content { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .highlight { background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 15px 0; }
          .button { display: inline-block; background: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="test-banner">
          🧪 THIS IS A TEST EMAIL - Weekly Report System
        </div>
        
        <div class="header">
          <h1>☕ Brontie Weekly Report</h1>
          <p>${merchant.name}</p>
        </div>
        
        <div class="content">
          <h2>Hello ${merchant.name}!</h2>
          <p>Here's your weekly business report from Brontie. Your PDF report is attached to this email.</p>
          
          <div class="highlight">
            <strong>📅 Payout Reminder:</strong> Your next payout is scheduled for <strong>${nextFriday.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
          </div>
          
          <h3>Quick Summary</h3>
          <p>This report covers your business activity and helps you track your progress on the Brontie platform. Even if you haven't had sales or redemptions this period, we still send this report to keep you informed.</p>
          
          <h3>What's in your PDF report:</h3>
          <ul>
            <li>📊 Total Revenue from Brontie</li>
            <li>💰 Total Payout from Brontie (all time)</li>
            <li>🎫 Active Vouchers count</li>
            <li>✅ Redeemed Vouchers (this period)</li>
            <li>💵 Payout amount this period</li>
            <li>🏆 Top selling items (last 2 weeks)</li>
            <li>📅 Payout date and next payout date</li>
            <li>🔗 Link to manage your products</li>
          </ul>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://brontie.com'}/cafes/items" class="button">
              Manage Your Products
            </a>
          </div>
          
          <h3>Need Help?</h3>
          <p>If you have any questions about your report or need assistance with your Brontie account, please don't hesitate to contact us:</p>
          <ul>
            <li>📧 Email: <a href="mailto:hello@brontie.com">hello@brontie.com</a></li>
            <li>💬 Support: Available through your dashboard</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>This report is automatically generated every Wednesday before your Friday payout.</p>
          <p>© ${new Date().getFullYear()} Brontie. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const emailText = `
      [TEST] Brontie Weekly Report - ${merchant.name}
      
      Hello ${merchant.name}!
      
      Here's your weekly business report from Brontie. Your PDF report is attached to this email.
      
      Payout Reminder: Your next payout is scheduled for ${nextFriday.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
      
      Quick Summary:
      This report covers your business activity and helps you track your progress on the Brontie platform. Even if you haven't had sales or redemptions this period, we still send this report to keep you informed.
      
      What's in your PDF report:
      - Total Revenue from Brontie
      - Total Payout from Brontie (all time)
      - Active Vouchers count
      - Redeemed Vouchers (this period)
      - Payout amount this period
      - Top selling items (last 2 weeks)
      - Payout date and next payout date
      - Link to manage your products
      
      Manage Your Products: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://brontie.com'}/cafes/items
      
      Need Help?
      If you have any questions about your report or need assistance with your Brontie account, please don't hesitate to contact us:
      - Email: hello@brontie.com
      - Support: Available through your dashboard
      
      This report is automatically generated every Wednesday before your Friday payout.
      
      © ${new Date().getFullYear()} Brontie. All rights reserved.
    `;

    // Send email with PDF attachment
    await sendEmail({
      to: recipientEmail,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });

    // Update report to mark as sent
    report.emailSent = true;
    report.sentAt = new Date();
    await report.save();

    console.log(`✅ Test report sent successfully to ${recipientEmail}`);

      return NextResponse.json({ 
      success: true, 
      message: 'Test report generated and sent successfully',
      merchantName: merchant.name,
      emailSent: true,
      recipientEmail,
      reportId: report._id.toString(),
      invoiceNumber: invoiceNumber
    });

  } catch (error) {
    console.error('Error generating and sending test report:', error);
    return NextResponse.json({ 
      error: 'Failed to generate or send test report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
