import { NextRequest, NextResponse } from 'next/server';
import { generateCafeReport } from '@/lib/pdf-report-generator';
import { sendEmail } from '@/lib/email';
import { connectToDatabase } from '@/lib/mongodb';
import Merchant from '@/models/Merchant';
import { shouldRunBiweeklyCron, recordCronRun } from '@/lib/cron-helper';

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate Vercel cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🚀 Starting biweekly report sending via Vercel Cron...');

    await connectToDatabase();

    // Check if we should run (biweekly logic - only every 14 days)
    const cronCheck = await shouldRunBiweeklyCron('send-reports');

    if (!cronCheck.shouldRun) {
      console.log(`⏭️ Skipping biweekly reports - only ${cronCheck.daysSinceLastRun} days since last run (need 14+)`);
      await recordCronRun('send-reports', 'skipped', cronCheck.periodStart, cronCheck.periodEnd,
        `Skipped - only ${cronCheck.daysSinceLastRun} days since last run`);

      return NextResponse.json({
        success: true,
        message: 'Skipped - biweekly schedule not met',
        daysSinceLastRun: cronCheck.daysSinceLastRun,
        nextRunIn: 14 - (cronCheck.daysSinceLastRun || 0)
      });
    }

    console.log(`✅ Running biweekly reports for period: ${cronCheck.periodStart.toLocaleDateString('en-GB')} to ${cronCheck.periodEnd.toLocaleDateString('en-GB')}`);

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
      errors: [] as string[],
      startTime: new Date().toISOString()
    };

    console.log(`📧 Sending reports to ${merchants.length} merchants...`);

    // Send reports to each merchant
    for (const merchant of merchants) {
      try {
        console.log(`Generating report for ${merchant.name} (${merchant._id})...`);
        
        // Generate PDF report
        const { buffer: pdfBuffer } = await generateCafeReport(merchant._id.toString());
        
        // Prepare email content
        const today = new Date();
        const reportDate = today.toLocaleDateString('en-GB', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        // Calculate next Wednesday (payout day - 2 days from Monday)
        const nextWednesday = new Date(today);
        nextWednesday.setDate(today.getDate() + 2); // Monday + 2 = Wednesday

        const periodStartStr = cronCheck.periodStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        const periodEndStr = cronCheck.periodEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

        const emailSubject = `Brontie Biweekly Report - ${merchant.name} (${periodStartStr} - ${periodEndStr})`;
        
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
            </style>
          </head>
          <body>
            <div class="header">
              <h1>☕ Brontie Biweekly Report</h1>
              <p>${merchant.name}</p>
            </div>

            <div class="content">
              <h2>Hello ${merchant.name}!</h2>
              <p>Here's your biweekly business report from Brontie covering <strong>${periodStartStr} - ${periodEndStr}</strong>. Your PDF report is attached to this email.</p>

              <div class="highlight">
                <strong>📅 Payout Reminder:</strong> Your payout for this period will be processed on <strong>${nextWednesday.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</strong> and should arrive in your account by Friday.
              </div>

              <h3>Quick Summary</h3>
              <p>This report covers your business activity from the past 2 weeks and helps you track your progress on the Brontie platform. Even if you haven't had sales or redemptions this period, we still send this report to keep you informed.</p>

              <h3>What's in your PDF report:</h3>
              <ul>
                <li>📊 Total Revenue from Brontie</li>
                <li>💰 Total Payout from Brontie (all time)</li>
                <li>🎫 Active Vouchers count</li>
                <li>✅ Redeemed Vouchers (this 2-week period)</li>
                <li>💵 Payout amount this period</li>
                <li>📋 Recent transactions with invoice numbers</li>
                <li>🏆 Top selling items (last 2 weeks)</li>
                <li>📅 Payment period dates</li>
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
              <p>This report is automatically generated every other Monday. Payouts are processed every other Wednesday.</p>
              <p>Payment Period: ${periodStartStr} - ${periodEndStr}</p>
              <p>© ${new Date().getFullYear()} Brontie. All rights reserved.</p>
            </div>
          </body>
          </html>
        `;

        const emailText = `
          Brontie Biweekly Report - ${merchant.name}
          Payment Period: ${periodStartStr} - ${periodEndStr}

          Hello ${merchant.name}!

          Here's your biweekly business report from Brontie covering ${periodStartStr} - ${periodEndStr}. Your PDF report is attached to this email.

          Payout Reminder: Your payout for this period will be processed on ${nextWednesday.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} and should arrive in your account by Friday.

          Quick Summary:
          This report covers your business activity from the past 2 weeks and helps you track your progress on the Brontie platform. Even if you haven't had sales or redemptions this period, we still send this report to keep you informed.

          What's in your PDF report:
          - Total Revenue from Brontie
          - Total Payout from Brontie (all time)
          - Active Vouchers count
          - Redeemed Vouchers (this 2-week period)
          - Payout amount this period
          - Recent transactions with invoice numbers
          - Top selling items (last 2 weeks)
          - Payment period dates
          - Link to manage your products

          Manage Your Products: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://brontie.com'}/cafes/items

          Need Help?
          If you have any questions about your report or need assistance with your Brontie account, please don't hesitate to contact us:
          - Email: hello@brontie.com
          - Support: Available through your dashboard

          This report is automatically generated every other Monday. Payouts are processed every other Wednesday.

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
              filename: `brontie-report-${merchant.name.replace(/[^a-zA-Z0-9]/g, '-')}-${today.toISOString().split('T')[0]}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf'
            }
          ]
        });

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

    const endTime = new Date().toISOString();
    const duration = new Date(endTime).getTime() - new Date(results.startTime).getTime();

    console.log(`📊 Biweekly reports completed. Successful: ${results.successful}, Failed: ${results.failed}`);
    console.log(`⏱️ Duration: ${duration}ms`);

    // Record successful cron run
    await recordCronRun('send-reports', 'success', cronCheck.periodStart, cronCheck.periodEnd,
      `Sent ${results.successful} reports, ${results.failed} failed`);

    return NextResponse.json({
      success: true,
      message: 'Biweekly reports sent via Vercel Cron',
      period: {
        start: cronCheck.periodStart.toISOString(),
        end: cronCheck.periodEnd.toISOString(),
      },
      results: {
        ...results,
        endTime,
        duration: `${duration}ms`
      }
    });

  } catch (error) {
    console.error('❌ Error in Vercel cron job:', error);

    // Record failed cron run
    try {
      await recordCronRun('send-reports', 'failed', undefined, undefined,
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } catch (recordError) {
      console.error('Failed to record cron run:', recordError);
    }

    return NextResponse.json({
      error: 'Failed to send biweekly reports via cron',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
