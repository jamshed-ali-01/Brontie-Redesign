import mongoose, { Schema, Document } from 'mongoose';

export interface IMerchantDemo extends Document {
  merchantId: mongoose.Types.ObjectId;
  status: 'active' | 'redeemed';
  recipientName: string;
  senderName: string;
  itemName: string;
  itemPrice: number;
  itemImage?: string;
  message?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MerchantDemoSchema: Schema = new Schema(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    status: { 
      type: String, 
      enum: ['active', 'redeemed'], 
      default: 'active' 
    },
    recipientName: { type: String, default: 'Demo Recipient' },
    senderName: { type: String, default: 'Demo Sender' },
    itemName: { type: String, default: 'Cappuccino' },
    itemPrice: { type: Number, default: 4.50 },
    itemImage: { type: String },
    message: { type: String, default: 'Enjoy this coffee on me! ☕' },
    expiresAt: { 
      type: Date, 
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // Auto-delete in 24h
    },
  },
  { timestamps: true }
);

// TTL index to automatically remove demo data after 24h
MerchantDemoSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
MerchantDemoSchema.index({ merchantId: 1 });

export default mongoose.models.MerchantDemo || 
  mongoose.model<IMerchantDemo>('MerchantDemo', MerchantDemoSchema);
