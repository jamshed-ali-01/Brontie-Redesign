import mongoose, { Schema, Document } from 'mongoose';

export interface IPayoutItem extends Document {
  voucherId: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId;
  amountPayable: number;
  brontieFee: number;
  stripeFee: number;
  status: 'pending' | 'paid' | 'reversed';
  paidOutAt?: Date;
  transferId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayoutItemSchema: Schema = new Schema(
  {
    voucherId: { type: Schema.Types.ObjectId, ref: 'Voucher', required: true },
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    amountPayable: { type: Number, required: true },
    brontieFee: { type: Number, required: true },
    stripeFee: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'paid', 'reversed'], 
      default: 'pending',
      required: true 
    },
    paidOutAt: { type: Date },
    transferId: { type: String },
  },
  { timestamps: true }
);

// Index for faster lookups
PayoutItemSchema.index({ merchantId: 1, status: 1 });
PayoutItemSchema.index({ voucherId: 1 });
PayoutItemSchema.index({ paidOutAt: 1 });

export default mongoose.models.PayoutItem || mongoose.model<IPayoutItem>('PayoutItem', PayoutItemSchema);
