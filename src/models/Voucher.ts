import mongoose, { Schema, Document } from 'mongoose';

export interface IVoucher extends Document {
  giftItemId: mongoose.Types.ObjectId;
  status:
  | 'redeemed'
  | 'unredeemed'
  | 'refunded'
  | 'pending'
  | 'issued'
  | 'expired'
  | 'disputed';
  createdAt: Date;
  redeemedAt?: Date;
  refundedAt?: Date;
  confirmedAt?: Date;
  issuedAt?: Date;
  expiresAt?: Date;
  recipientName?: string;
  senderName?: string;
  email?: string; // Customer email for sending payment success emails
  redemptionLink: string;
  validLocationIds: mongoose.Types.ObjectId[];
  paymentIntentId?: string;
  amount?: number;
  amountGross?: number;
  stripeFee?: number;
  productSku?: string;
  redemptionCode?: string;
  messageCardId?: string;
  // Viral loop fields
  recipientToken?: string;
  recipientBecameSender?: boolean;
  recipientLinkedSenderEmail?: string;
  recipientEmail?: string;
  message?: string; // Personal message from sender
  // QR attribution
  qrShortId?: string;

  // NEW: Organization fields
  isOrganization?: boolean;
  organizationId?: mongoose.Types.ObjectId | null;

  // NEW: Bulk Dashboard fields
  bulkDashboardId?: mongoose.Types.ObjectId | null;
  sentAt?: Date;
  isEmailSent?: boolean;
}

const VoucherSchema: Schema = new Schema(
  {
    giftItemId: {
      type: Schema.Types.ObjectId,
      ref: 'GiftItem',
      required: true,
    },
    status: {
      type: String,
      enum: [
        'redeemed',
        'unredeemed',
        'refunded',
        'pending',
        'issued',
        'expired',
        'disputed',
      ],
      default: 'pending',
      required: true,
    },
    redeemedAt: { type: Date },
    refundedAt: { type: Date },
    confirmedAt: { type: Date },
    issuedAt: { type: Date },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
    }, // 5 years from now
    recipientName: { type: String },
    senderName: { type: String },
    email: { type: String }, // Customer email for sending payment success emails
    redemptionLink: { type: String, required: true, unique: true },
    validLocationIds: [{ type: Schema.Types.ObjectId, ref: 'MerchantLocation' }],
    paymentIntentId: { type: String, sparse: true, index: true },
    amount: { type: Number },
    amountGross: { type: Number },
    stripeFee: { type: Number },
    productSku: { type: String },
    redemptionCode: { type: String },
    messageCardId: { type: String },

    // Viral loop fields
    recipientToken: { type: String, unique: true, sparse: true },
    recipientBecameSender: { type: Boolean, default: false },
    recipientLinkedSenderEmail: { type: String },
    recipientEmail: { type: String },
    message: { type: String }, // Personal message from sender

    // QR attribution
    qrShortId: { type: String, index: true },

    // NEW: Organization related fields
    isOrganization: { type: Boolean, default: false, index: true },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },

    // NEW: Bulk Dashboard related fields
    bulkDashboardId: {
      type: Schema.Types.ObjectId,
      ref: 'BulkDashboard',
      default: null,
      index: true,
    },
    sentAt: { type: Date },
    isEmailSent: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Indexes for faster lookups
VoucherSchema.index({ giftItemId: 1 });
VoucherSchema.index({ status: 1 });

VoucherSchema.index({ issuedAt: 1 });
VoucherSchema.index({ redeemedAt: 1 });
VoucherSchema.index({ productSku: 1 });
VoucherSchema.index({ expiresAt: 1 });
// Indexes added for organization lookups
// VoucherSchema.index({ organizationId: 1 });
// VoucherSchema.index({ isOrganization: 1 });

// Prevent model overwrite during hot reloads (Next.js)
export default mongoose.models.Voucher ||
  mongoose.model<IVoucher>('Voucher', VoucherSchema);
