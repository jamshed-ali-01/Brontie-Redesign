import jsPDF from 'jspdf';
import { connectToDatabase } from './mongodb';
import Merchant from '@/models/Merchant';
import Voucher from '@/models/Voucher';
import Transaction from '@/models/Transaction';
import GiftItem from '@/models/GiftItem';
import PayoutItem from '@/models/PayoutItem';
import mongoose from 'mongoose';
import RedeemedPeriodReset from '@/models/RedeemedPeriodReset';
import { getNextInvoiceNumber } from './invoice-counter';

export interface ReportData {
  invoiceNumber?: number;
  merchant: {
    name: string;
    contactEmail: string;
    logoUrl?: string;
  };
  reportPeriod: {
    from: string;
    to: string;
  };
  totalRevenue: number;
  totalPayoutFromBrontie: number;
  activeVouchers: number;
  redeemedVouchers: number;
  payoutThisPeriod: number;
  topSellers: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  transactions: Array<{
    invoiceNumber: number | string;
    date: string;
    type: string;
    amount: number;
  }>;
  payoutDate: string;
  nextPayoutDate: string;
  manageProductsLink: string;
}

export class PDFReportGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentY: number;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.currentY = this.margin;
  }

  // Helper function to format currency with proper encoding
  // Note: jsPDF's default Helvetica font doesn't support the euro symbol (€)
  // We use "EUR" as a workaround to avoid encoding issues
  private formatCurrency(amount: number, symbol: string = '€'): string {
    const formattedAmount = amount.toFixed(2);

    if (symbol === '€') {
      // Use "EUR" instead of € symbol since jsPDF's default fonts don't support it
      // This prevents the "ï¿½" encoding issue
      return `EUR ${formattedAmount}`;
    }

    // For dollar sign and other ASCII characters, use the actual character
    return `${symbol}${formattedAmount}`;
  }

  private addHeader(merchantName: string, invoiceNumber?: number, logoUrl?: string): void {
    // Brontie header with background
    this.doc.setFillColor(20, 184, 166); // Primary teal color
    this.doc.rect(0, 0, this.pageWidth, 50, 'F');

    // Brontie logo text (white on teal background)
    this.doc.setFontSize(28);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255); // White text
    this.doc.text('Brontie', this.margin, 30);

    // Invoice number on top right
    if (invoiceNumber) {
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(255, 255, 255); // White text
      const invoiceText = `Invoice #${invoiceNumber}`;
      const invoiceX = this.pageWidth - this.margin - this.doc.getTextWidth(invoiceText);
      this.doc.text(invoiceText, invoiceX, 30);
    }

    this.currentY = 70;

    // Report title with merchant name
    this.doc.setFontSize(22);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(`${merchantName}`, this.margin, this.currentY);

    this.currentY += 8;

    // Report subtitle
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 100, 100);
    this.doc.text('Biweekly Performance Report', this.margin, this.currentY);

    this.currentY += 20;

    // Report period with styled box
    this.doc.setFillColor(248, 250, 252); // Light gray background
    this.doc.rect(this.margin, this.currentY - 5, this.pageWidth - (this.margin * 2), 20, 'F');

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(75, 85, 99); // Gray text
    const today = new Date();
    const reportDate = today.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    this.doc.text(`Report generated: ${reportDate}`, this.margin + 5, this.currentY + 5);

    this.currentY += 35;
  }

  private addSection(title: string): void {
    if (this.currentY > this.pageHeight - 80) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    // Section background
    this.doc.setFillColor(249, 250, 251); // Very light gray
    this.doc.rect(this.margin, this.currentY - 5, this.pageWidth - (this.margin * 2), 25, 'F');

    // Section border
    this.doc.setDrawColor(20, 184, 166); // Teal border
    this.doc.setLineWidth(2);
    this.doc.rect(this.margin, this.currentY - 5, this.pageWidth - (this.margin * 2), 25, 'S');

    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(title, this.margin + 10, this.currentY + 8);

    this.currentY += 30;
  }

  private addMetricRow(label: string, value: string, color: [number, number, number] = [0, 0, 0]): void {
    if (this.currentY > this.pageHeight - 40) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    // Metric background
    this.doc.setFillColor(255, 255, 255); // White background
    this.doc.rect(this.margin, this.currentY - 3, this.pageWidth - (this.margin * 2), 20, 'F');

    // Metric border
    this.doc.setDrawColor(229, 231, 235); // Light gray border
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.margin, this.currentY - 3, this.pageWidth - (this.margin * 2), 20, 'S');

    // Label
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(75, 85, 99); // Gray text
    this.doc.text(label + ':', this.margin + 10, this.currentY + 8);

    // Value
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.setTextColor(color[0], color[1], color[2]);
    this.doc.text(value, this.pageWidth - this.margin - this.doc.getTextWidth(value) - 10, this.currentY + 8);

    this.currentY += 25;
  }

  private addTransactionsTable(transactions: ReportData['transactions']): void {
    if (this.currentY > this.pageHeight - 100) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    this.addSection('Recent Transactions (Last 30 Days)');

    if (transactions.length === 0) {
      // No data message with styling
      this.doc.setFillColor(254, 242, 242); // Light red background
      this.doc.rect(this.margin, this.currentY - 5, this.pageWidth - (this.margin * 2), 25, 'F');

      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'italic');
      this.doc.setTextColor(127, 29, 29); // Red text
      this.doc.text('No transaction data available for this period', this.margin + 10, this.currentY + 8);
      this.currentY += 35;
      return;
    }

    // Table header with background
    this.doc.setFillColor(20, 184, 166); // Teal background
    this.doc.rect(this.margin, this.currentY - 5, this.pageWidth - (this.margin * 2), 20, 'F');

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255); // White text

    // this.doc.text('Invoice #', this.margin + 5, this.currentY + 8);
    // this.doc.text('Date', this.margin + 40, this.currentY + 8);
    // this.doc.text('Type', this.margin + 85, this.currentY + 8);
    // this.doc.text('Amount', this.margin + 130, this.currentY + 8);

    this.doc.text('Date', this.margin + 4, this.currentY + 8);
    this.doc.text('Type', this.margin + 65, this.currentY + 8);
    this.doc.text('Amount', this.margin + 130, this.currentY + 8);

    this.currentY += 25;

    // Table rows with alternating colors
    transactions.forEach((txn, index) => {
      if (txn.type == "Refund") {
        //skip refund transactions
        return;
      }

      if (this.currentY > this.pageHeight - 30) {
        this.doc.addPage();
        this.currentY = this.margin;
      }

      // Alternating row colors
      if (index % 2 === 0) {
        this.doc.setFillColor(249, 250, 251); // Light gray
      } else {
        this.doc.setFillColor(255, 255, 255); // White
      }
      this.doc.rect(this.margin, this.currentY - 3, this.pageWidth - (this.margin * 2), 18, 'F');

      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(0, 0, 0);

      // this.doc.text(txn.invoiceNumber.toString(), this.margin + 5, this.currentY + 8);
      // this.doc.text(txn.date, this.margin + 40, this.currentY + 8);
      // this.doc.text(txn.type, this.margin + 85, this.currentY + 8);
      // this.doc.text(`€${txn.amount.toFixed(2)}`, this.margin + 130, this.currentY + 8);

      this.doc.text(txn.date, this.margin + 5, this.currentY + 8);
      this.doc.text(txn.type, this.margin + 65, this.currentY + 8);
      this.doc.text(this.formatCurrency(txn.amount, '€'), this.margin + 130, this.currentY + 8);

      this.currentY += 20;
    });

    this.currentY += 15;
  }

  private addTopSellersTable(topSellers: ReportData['topSellers']): void {
    if (this.currentY > this.pageHeight - 100) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    this.addSection('Top Selling Items (Last 30 Days)');

    if (topSellers.length === 0) {
      // No data message with styling
      this.doc.setFillColor(254, 242, 242); // Light red background
      this.doc.rect(this.margin, this.currentY - 5, this.pageWidth - (this.margin * 2), 25, 'F');

      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'italic');
      this.doc.setTextColor(127, 29, 29); // Red text
      this.doc.text('No sales data available for this period', this.margin + 10, this.currentY + 8);
      this.currentY += 35;
      return;
    }

    // Table header with background
    this.doc.setFillColor(20, 184, 166); // Teal background
    this.doc.rect(this.margin, this.currentY - 5, this.pageWidth - (this.margin * 2), 20, 'F');

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255); // White text

    this.doc.text('Item', this.margin + 10, this.currentY + 8);
    this.doc.text('Sales', this.margin + 100, this.currentY + 8);
    this.doc.text('Revenue', this.margin + 140, this.currentY + 8);

    this.currentY += 25;

    // Table rows with alternating colors
    topSellers.slice(0, 5).forEach((item, index) => {
      if (this.currentY > this.pageHeight - 30) {
        this.doc.addPage();
        this.currentY = this.margin;
      }

      // Alternating row colors
      if (index % 2 === 0) {
        this.doc.setFillColor(249, 250, 251); // Light gray
      } else {
        this.doc.setFillColor(255, 255, 255); // White
      }
      this.doc.rect(this.margin, this.currentY - 3, this.pageWidth - (this.margin * 2), 18, 'F');

      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(0, 0, 0);

      // Rank with number for top 3
      const rankText = index === 0 ? '1st' : index === 1 ? '2nd' : index === 2 ? '3rd' : `${index + 1}.`;
      this.doc.text(`${rankText} ${item.name}`, this.margin + 10, this.currentY + 8);
      this.doc.text(item.sales.toString(), this.margin + 100, this.currentY + 8);
      this.doc.text(this.formatCurrency(item.revenue, '€'), this.margin + 140, this.currentY + 8);

      this.currentY += 20;
    });

    this.currentY += 15;
  }

  private addFooter(manageProductsLink: string): void {
    if (this.currentY > this.pageHeight - 80) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    this.currentY += 20;

    // Footer section with background
    this.doc.setFillColor(248, 250, 252); // Light gray background
    this.doc.rect(this.margin, this.currentY - 10, this.pageWidth - (this.margin * 2), 80, 'F');

    // Border
    this.doc.setDrawColor(20, 184, 166); // Teal border
    this.doc.setLineWidth(2);
    this.doc.rect(this.margin, this.currentY - 10, this.pageWidth - (this.margin * 2), 80, 'S');

    // Manage products section
    this.doc.setFontSize(13);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(20, 184, 166);
    this.doc.text('Manage Your Products:', this.margin + 10, this.currentY + 5);

    this.currentY += 12;

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(11);
    this.doc.setTextColor(59, 130, 246); // Blue link color
    this.doc.text(manageProductsLink, this.margin + 10, this.currentY);

    this.currentY += 20;

    // Footer note - split long text into multiple lines
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(75, 85, 99); // Gray text

    // Split the long text into multiple lines
    const longText = 'This report is automatically generated every other Friday. Payouts are processed every other Friday.';
    const words = longText.split(' ');
    let currentLine = '';
    let lineCount = 0;

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      if (this.doc.getTextWidth(testLine) > (this.pageWidth - this.margin * 2 - 20)) {
        if (currentLine) {
          this.doc.text(currentLine, this.margin + 10, this.currentY);
          this.currentY += 8;
          lineCount++;
        }
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      this.doc.text(currentLine, this.margin + 10, this.currentY);
      this.currentY += 8;
    }

    this.doc.text('For support, contact hello@brontie.com', this.margin + 10, this.currentY);
  }

  public generateReport(data: ReportData): Buffer {
    this.addHeader(data.merchant.name, data.invoiceNumber, data.merchant.logoUrl);

    // Add payment period prominently
    this.doc.setFillColor(254, 249, 195); // Light yellow background
    this.doc.rect(this.margin, this.currentY - 5, this.pageWidth - (this.margin * 2), 30, 'F');

    this.doc.setDrawColor(245, 158, 11); // Amber border
    this.doc.setLineWidth(2);
    this.doc.rect(this.margin, this.currentY - 5, this.pageWidth - (this.margin * 2), 30, 'S');

    this.doc.setFontSize(13);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(146, 64, 14); // Amber text
    this.doc.text('Payment Period:', this.margin + 10, this.currentY + 5);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(`${data.reportPeriod.from} - ${data.reportPeriod.to}`, this.margin + 10, this.currentY + 16);

    this.currentY += 45;

    this.addSection('Financial Summary');
    this.addMetricRow('Total Revenue', this.formatCurrency(data.totalRevenue, '€'), [20, 184, 166]); // Teal
    this.addMetricRow('Total Payout from Brontie', this.formatCurrency(data.totalPayoutFromBrontie, '€'), [34, 197, 94]); // Green
    this.addMetricRow('Payout This Period', this.formatCurrency(data.payoutThisPeriod, '€'), [245, 158, 11]); // Amber

    this.currentY += 10;

    this.addSection('Voucher Activity');
    this.addMetricRow('Active Vouchers', data.activeVouchers.toString(), [59, 130, 246]); // Blue
    this.addMetricRow('Redeemed Vouchers', data.redeemedVouchers.toString(), [34, 197, 94]); // Green

    this.currentY += 10;

    this.addSection('Payout Schedule');
    this.addMetricRow('Payout Date', data.payoutDate, [245, 158, 11]); // Amber
    this.addMetricRow('Next Payout Date', data.nextPayoutDate, [34, 197, 94]); // Green

    this.addTransactionsTable(data.transactions);
    this.addTopSellersTable(data.topSellers);
    this.addFooter(data.manageProductsLink);

    return Buffer.from(this.doc.output('arraybuffer'));
  }
}

// Helper function to get the next bi-weekly Monday (payout date)
// Payouts happen every 2 weeks on Monday
function getPayoutDate(): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day

  // Reference date: First Monday of January 2024 (or any fixed Monday)
  // This establishes the bi-weekly schedule pattern
  const referenceDate = new Date(2024, 0, 1); // January 1, 2024
  // Find first Monday of January 2024
  const firstDayOfWeek = referenceDate.getDay(); // 0 = Sunday, 1 = Monday
  const daysToFirstMonday = (1 - firstDayOfWeek + 7) % 7 || 7;
  const firstPayoutMonday = new Date(2024, 0, 1 + daysToFirstMonday);
  firstPayoutMonday.setHours(0, 0, 0, 0);

  // Calculate days since reference Monday
  const daysSinceReference = Math.floor((today.getTime() - firstPayoutMonday.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate which bi-weekly period we're in (every 14 days)
  const periodsSinceReference = Math.floor(daysSinceReference / 14);

  // Calculate the last scheduled payout Monday
  const lastScheduledMonday = new Date(firstPayoutMonday);
  lastScheduledMonday.setDate(firstPayoutMonday.getDate() + (periodsSinceReference * 14));

  // Calculate the next scheduled payout Monday (2 weeks after last scheduled)
  const nextScheduledMonday = new Date(lastScheduledMonday);
  nextScheduledMonday.setDate(lastScheduledMonday.getDate() + 14);

  // If the next scheduled Monday is today or in the past, move to the next one
  if (nextScheduledMonday <= today) {
    nextScheduledMonday.setDate(nextScheduledMonday.getDate() + 14);
  }

  return nextScheduledMonday.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
}

// Helper function to get the next payout date (2 weeks after the scheduled payout Monday)
function getNextPayoutDate(): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day

  // Reference date: First Monday of January 2024 (or any fixed Monday)
  const referenceDate = new Date(2024, 0, 1); // January 1, 2024
  const firstDayOfWeek = referenceDate.getDay(); // 0 = Sunday, 1 = Monday
  const daysToFirstMonday = (1 - firstDayOfWeek + 7) % 7 || 7;
  const firstPayoutMonday = new Date(2024, 0, 1 + daysToFirstMonday);
  firstPayoutMonday.setHours(0, 0, 0, 0);

  // Calculate days since reference Monday
  const daysSinceReference = Math.floor((today.getTime() - firstPayoutMonday.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate which bi-weekly period we're in (every 14 days)
  const periodsSinceReference = Math.floor(daysSinceReference / 14);

  // Calculate the last scheduled payout Monday
  const lastScheduledMonday = new Date(firstPayoutMonday);
  lastScheduledMonday.setDate(firstPayoutMonday.getDate() + (periodsSinceReference * 14));

  // Calculate the next scheduled payout Monday (2 weeks after last scheduled)
  const nextScheduledMonday = new Date(lastScheduledMonday);
  nextScheduledMonday.setDate(lastScheduledMonday.getDate() + 14);

  // If the next scheduled Monday is today or in the past, move to the next one
  if (nextScheduledMonday <= today) {
    nextScheduledMonday.setDate(nextScheduledMonday.getDate() + 14);
  }

  // Add 2 weeks (14 days) to get the next payout date after that
  const nextPayoutDate = new Date(nextScheduledMonday);
  nextPayoutDate.setDate(nextScheduledMonday.getDate() + 14);

  return nextPayoutDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
}

export async function generateCafeReport(merchantId: string): Promise<{ buffer: Buffer; invoiceNumber: number; reportPeriod: { from: Date; to: Date } }> {
  await connectToDatabase();

  const merchantObjectId = new mongoose.Types.ObjectId(merchantId);

  // Get merchant details
  const merchant = await Merchant.findById(merchantObjectId);
  if (!merchant) {
    throw new Error('Merchant not found');
  }

  // Get date range for last 30 days (same as dashboard)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Enforce minimum start date: Sep 26, 2025 08:16 AM UTC (same as dashboard)
  const MIN_START_ISO = '2025-09-26T08:16:00.000Z';
  const minStartDate = new Date(MIN_START_ISO);
  const effectiveStartDate = new Date(Math.max(thirtyDaysAgo.getTime(), minStartDate.getTime()));

  // ========== REDEEMED PERIOD RESET LOGIC (Matched with Dashboard) ==========
  const latestReset = await RedeemedPeriodReset.findOne({
    merchantId: merchantObjectId
  }).sort({ resetAt: -1 });

  const redeemedStartDate = latestReset ?
    new Date(latestReset.resetAt) :
    new Date(MIN_START_ISO);
  // =========================================================================

  const amountExpr = { $ifNull: ["$amountGross", "$giftItem.price"] };

  // Get active vouchers (unredeemed, valid) - same logic as dashboard
  const activeVouchers = await Voucher.aggregate([
    {
      $lookup: {
        from: 'giftitems',
        localField: 'giftItemId',
        foreignField: '_id',
        as: 'giftItem'
      }
    },
    {
      $unwind: '$giftItem'
    },
    {
      $match: {
        'giftItem.merchantId': merchantObjectId,
        status: { $in: ['issued', 'pending', 'unredeemed'] },
        createdAt: { $gte: minStartDate }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        totalValue: { $sum: amountExpr }
      }
    }
  ]);

  // Get actually paid out amounts from PayoutItem collection
  const paidOutAmounts = await PayoutItem.aggregate([
    {
      $match: {
        merchantId: merchantObjectId,
        status: 'paid',
        paidOutAt: { $gte: minStartDate }
      }
    },
    {
      $group: {
        _id: null,
        totalPaidOut: { $sum: '$amountPayable' },
        totalCount: { $sum: 1 }
      }
    }
  ]);

  // Get redeemed vouchers - same logic as dashboard
  const redeemedVouchers = await Voucher.aggregate([
    {
      $lookup: {
        from: 'giftitems',
        localField: 'giftItemId',
        foreignField: '_id',
        as: 'giftItem'
      }
    },
    {
      $unwind: '$giftItem'
    },
    {
      $match: {
        'giftItem.merchantId': merchantObjectId,
        status: 'redeemed',
        redeemedAt: { $gte: redeemedStartDate }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        totalValue: { $sum: amountExpr }
      }
    }
  ]);

  // Get top selling items (last 30 days) - based on vouchers (active + redeemed) - same logic as dashboard
  const topSellingItems = await Voucher.aggregate([
    {
      $lookup: {
        from: 'giftitems',
        localField: 'giftItemId',
        foreignField: '_id',
        as: 'giftItem'
      }
    },
    {
      $unwind: '$giftItem'
    },
    {
      $match: {
        'giftItem.merchantId': merchantObjectId,
        status: { $in: ['issued', 'pending', 'unredeemed', 'redeemed'] },
        createdAt: { $gte: minStartDate }
      }
    },
    {
      $group: {
        _id: '$giftItemId',
        name: { $first: '$giftItem.name' },
        sales: { $sum: 1 },
        revenue: { $sum: amountExpr }
      }
    },
    {
      $sort: { sales: -1 }
    },
    {
      $limit: 5
    }
  ]);

  // Calculate revenue based on vouchers (active + redeemed) - this represents actual sales - same as dashboard
  const voucherSales = await Voucher.aggregate([
    {
      $lookup: {
        from: 'giftitems',
        localField: 'giftItemId',
        foreignField: '_id',
        as: 'giftItem'
      }
    },
    {
      $unwind: '$giftItem'
    },
    {
      $match: {
        'giftItem.merchantId': merchantObjectId,
        status: { $in: ['issued', 'pending', 'unredeemed', 'redeemed'] },
        createdAt: { $gte: minStartDate }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: amountExpr },
        totalSales: { $sum: 1 }
      }
    }
  ]);

  // Calculate payout (net after fees) using completed transactions
  const completedPurchases = await Transaction.aggregate([
    {
      $match: {
        merchantId: merchantObjectId,
        type: 'purchase',
        status: 'completed',
        createdAt: { $gte: minStartDate }
      }
    },
    {
      $lookup: {
        from: 'vouchers',
        localField: 'voucherId',
        foreignField: '_id',
        as: 'voucher'
      }
    },
    { $unwind: '$voucher' },
    { $match: { 'voucher.createdAt': { $gte: minStartDate } } },
    {
      $group: {
        _id: null,
        totalPayout: { $sum: '$amount' },
        totalStripeFees: { $sum: { $add: [{ $multiply: ['$amount', 0.02] }, 0.25] } }, // 2% + €0.25 Stripe fee
        totalBrontieFees: { $sum: { $multiply: ['$amount', 0.05] } }, // 5% Brontie fee
        netToCafe: { $sum: { $subtract: ['$amount', { $add: [{ $multiply: ['$amount', 0.07] }, 0.25] }] } } // Net after all fees (5% Brontie + 2% Stripe + 0.25)
      }
    }
  ]);

  // Get payout transactions (completed purchases) with automatic Stripe fee calculation
  const payoutTransactions = await Transaction.aggregate([
    {
      $match: {
        merchantId: merchantObjectId,
        type: 'purchase',
        status: 'completed',
        createdAt: { $gte: minStartDate }
      }
    },
    {
      $lookup: {
        from: 'vouchers',
        localField: 'voucherId',
        foreignField: '_id',
        as: 'voucher'
      }
    },
    { $unwind: '$voucher' },
    { $match: { 'voucher.createdAt': { $gte: minStartDate } } },
    {
      $lookup: {
        from: 'giftitems',
        localField: 'giftItemId',
        foreignField: '_id',
        as: 'giftItem'
      }
    },
    {
      $unwind: '$giftItem'
    },
    {
      $addFields: {
        calculatedStripeFee: {
          $ifNull: [
            '$stripeFee',
            {
              $add: [
                { $multiply: ['$amount', 0.02] },
                0.25
              ]
            }
          ]
        }
      }
    },
    {
      $project: {
        itemName: '$giftItem.name',
        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        grossPrice: '$amount',
        stripeFee: '$calculatedStripeFee', // Use calculated Stripe fee
        netAfterStripe: { $subtract: ['$amount', '$calculatedStripeFee'] }
      }
    },
    {
      $sort: { date: -1 }
    }
  ]);

  // If Brontie fee is not active for the merchant, do not deduct commission
  const rawCommissionRate = merchant.brontieFeeSettings?.commissionRate as number | undefined;
  const hasCommissionRate = typeof rawCommissionRate === 'number' && !isNaN(rawCommissionRate) && rawCommissionRate > 0;
  const isBrontieFeeActive = !!(merchant.brontieFeeSettings?.isActive && hasCommissionRate);
  const commissionRate = hasCommissionRate ? rawCommissionRate! : 0;

  const totalRevenue = voucherSales[0]?.totalRevenue || 0;
  // const totalPayoutFromBrontie = completedPurchases[0]?.netToCafe || 0;
  const totalPayoutFromBrontie = paidOutAmounts[0]?.totalPaidOut || 0;
  // const payoutThisPeriod = redeemedVouchers[0]?.totalValue || 0;

  // Calculate payout summary
  const grossTotal = payoutTransactions.reduce((sum, t) => sum + t.grossPrice, 0);
  const payoutStripeFees = payoutTransactions.reduce((sum, t) => sum + t.stripeFee, 0);
  const netAfterStripe = grossTotal - payoutStripeFees;

  // Check if brontieFeeSettings exists and is active (post auto-activation)
  const isBrontieFeeActiveNow = isBrontieFeeActive;
  const brontieFee = isBrontieFeeActiveNow ? netAfterStripe * commissionRate : 0;
  const payoutThisPeriod = netAfterStripe - brontieFee;

  const topSellers = topSellingItems.map(item => ({
    name: item.name,
    sales: item.sales,
    revenue: item.revenue
  }));

  // Get recent activity (mix of new sales and redemptions)
  // We use Vouchers because "purchase" Transactions are only created at the time of redemption
  const recentVouchers = await Voucher.find({
    'validLocationIds': merchantObjectId, // Or find by merchant via giftItem
    createdAt: { $gte: minStartDate }
  })
    .populate('giftItemId')
    .sort({ createdAt: -1 })
    .lean();

  // Filter for vouchers belonging to this merchant since validLocationIds might be tricky
  // A more robust way is querying Vouchers matching the merchant's gift items
  const merchantGiftItems = await GiftItem.find({ merchantId: merchantObjectId }).select('_id');
  const merchantGiftItemIds = merchantGiftItems.map(g => g._id);

  const recentActivityRaw = await Voucher.find({
    giftItemId: { $in: merchantGiftItemIds },
    $or: [
      { createdAt: { $gte: minStartDate } },
      { redeemedAt: { $gte: redeemedStartDate } }
    ]
  })
    .populate('giftItemId')
    .sort({ createdAt: -1 })
    .lean();

  const activityList: any[] = [];

  for (const v of recentActivityRaw) {
    // 1. Add the Sale event
    activityList.push({
      dateObj: v.createdAt,
      invoiceNumber: v.redemptionCode.substring(0, 8).toUpperCase(),
      date: new Date(v.createdAt).toLocaleString('en-GB', {
        timeZone: 'Europe/Dublin',
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }),
      type: 'Purchase',
      amount: v.amount || v.amountGross || (v.giftItemId as any)?.price || 0
    });

    if (v.status === 'redeemed' && v.redeemedAt) {
      activityList.push({
        dateObj: v.redeemedAt,
        invoiceNumber: v.redemptionCode.substring(0, 8).toUpperCase(),
        date: new Date(v.redeemedAt).toLocaleString('en-GB', {
          timeZone: 'Europe/Dublin',
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }),
        type: 'Redemption',
        amount: v.amount || v.amountGross || (v.giftItemId as any)?.price || 0
      });
    }
  }

  // Sort combined list by date descending
  activityList.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  const transactions = activityList.map(item => ({
    invoiceNumber: item.invoiceNumber,
    date: item.date,
    type: item.type,
    amount: item.amount
  }));

  // Generate invoice number for the report
  const reportInvoiceNumber = await getNextInvoiceNumber();

  const reportData: ReportData = {
    invoiceNumber: reportInvoiceNumber,
    merchant: {
      name: merchant.name,
      contactEmail: merchant.contactEmail,
      logoUrl: merchant.logoUrl
    },
    reportPeriod: {
      from: effectiveStartDate.toLocaleDateString('en-GB'),
      to: new Date().toLocaleDateString('en-GB')
    },
    totalRevenue,
    totalPayoutFromBrontie,
    activeVouchers: activeVouchers[0]?.total || 0,
    redeemedVouchers: redeemedVouchers[0]?.total || 0,
    payoutThisPeriod,
    topSellers,
    transactions,
    payoutDate: getPayoutDate(),
    nextPayoutDate: getNextPayoutDate(), // 2 weeks after coming Friday
    manageProductsLink: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://brontie.com'}/cafes/items`
  };

  const generator = new PDFReportGenerator();
  const buffer = generator.generateReport(reportData);

  return {
    buffer,
    invoiceNumber: reportInvoiceNumber,
    reportPeriod: {
      from: effectiveStartDate,
      to: new Date()
    }
  };
}
