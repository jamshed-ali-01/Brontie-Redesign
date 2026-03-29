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

    await connectToDatabase();

    // Get all active merchants
    const merchants = await Merchant.find({ 
      status: 'approved',
      isActive: true,
      contactEmail: { $exists: true, $ne: '' }
    });

    const results = {
      total: merchants.length,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    console.log(`Starting to send reports to ${merchants.length} merchants...`);

    // Send reports to each merchant
    for (const merchant of merchants) {
      try {
        console.log(`Generating report for ${merchant.name} (${merchant._id})...`);
        
        // Generate PDF report
        const { buffer: pdfBuffer, invoiceNumber, reportPeriod } = await generateCafeReport(merchant._id.toString());
        
        // Prepare email content
        const today = new Date();
        const fileName = `brontie-report-${merchant.name.replace(/[^a-zA-Z0-9]/g, '-')}-${today.toISOString().split('T')[0]}.pdf`;
        
        // Save report to database
        const report = new Report({
          merchantId: merchant._id,
          invoiceNumber: invoiceNumber,
          reportPeriod: reportPeriod,
          pdfBuffer: pdfBuffer,
          fileName: fileName,
          emailSent: false, // Will update after sending
          recipientEmail: merchant.contactEmail
        });
        
        await report.save();
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

        const emailSubject = `Brontie Weekly Report - ${merchant.name} (${reportDate})`;
        
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Brontie Weekly Report</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #14b8a6, #0d9488); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
              .content { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .highlight { background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 15px 0; }
              .button { display: inline-block; background: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
              .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
              .metric { display: inline-block; background: white; padding: 15px; margin: 10px; border-radius: 6px; text-align: center; min-width: 120px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .metric-value { font-size: 24px; font-weight: bold; color: #14b8a6; }
              .metric-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
            </style>
          </head>
          <body>
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
          Brontie Weekly Report - ${merchant.name}
          
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
          to: merchant.contactEmail,
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

        results.successful++;
        console.log(`✅ Report sent successfully to ${merchant.name}`);

      } catch (error) {
        results.failed++;
        const errorMessage = `Failed to send report to ${merchant.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.errors.push(errorMessage);
        console.error(`❌ ${errorMessage}`);
      }

      // Add a small delay between emails to avoid overwhelming the email service
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`Report sending completed. Successful: ${results.successful}, Failed: ${results.failed}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Weekly reports sending completed',
      results
    });

  } catch (error) {
    console.error('Error in send-all reports:', error);
    return NextResponse.json({ 
      error: 'Failed to send reports',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
