import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  voucherId: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId;
  giftItemId: mongoose.Types.ObjectId;
  type: 'purchase' | 'redemption' | 'refund';
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  customerEmail?: string;
  senderName?: string;
  recipientName?: string;
  stripePaymentIntentId?: string;
  stripeFee?: number;
  brontieCommission?: number;
  merchantPayout?: number;
  stripePaidOut?: boolean;
  stripePaidOutAt?: Date;
  stripeTransferId?: string;
  createdAt: Date;
  completedAt?: Date;
  // QR attribution
  qrShortId?: string;
}

const TransactionSchema: Schema = new Schema(
  {
    voucherId: { type: Schema.Types.ObjectId, ref: 'Voucher', required: true },
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    giftItemId: { type: Schema.Types.ObjectId, ref: 'GiftItem', required: true },
    type: { 
      type: String, 
      enum: ['purchase', 'redemption', 'refund'], 
      required: true 
    },
    amount: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ['completed', 'pending', 'failed', 'refunded'], 
      default: 'pending',
      required: true 
    },
    customerEmail: { type: String },
    senderName: { type: String },
    recipientName: { type: String },
    stripePaymentIntentId: { type: String, unique: true, sparse: true },
    stripeFee: { type: Number },
    brontieCommission: { type: Number },
    merchantPayout: { type: Number },
    stripePaidOut: { type: Boolean, default: false },
    stripePaidOutAt: { type: Date },
    stripeTransferId: { type: String },
    completedAt: { type: Date },
    // QR attribution
    qrShortId: { type: String, index: true },
  },
  { timestamps: true }
);

// Indexes for faster lookups
TransactionSchema.index({ merchantId: 1, type: 1 });
TransactionSchema.index({ merchantId: 1, status: 1 });
TransactionSchema.index({ merchantId: 1, createdAt: -1 });
TransactionSchema.index({ merchantId: 1, stripePaidOut: 1 });
TransactionSchema.index({ voucherId: 1 });
TransactionSchema.index({ giftItemId: 1 });

// Check if the model exists before creating it to prevent overwriting during hot reloads
export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);


