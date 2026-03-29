import mongoose, { Schema, Document } from 'mongoose';

export interface IRedemptionLog extends Document {
  voucherId: mongoose.Types.ObjectId;
  merchantLocationId: mongoose.Types.ObjectId;
  timestamp: Date;
}

const RedemptionLogSchema: Schema = new Schema(
  {
    voucherId: { type: Schema.Types.ObjectId, ref: 'Voucher', required: true },
    merchantLocationId: { type: Schema.Types.ObjectId, ref: 'MerchantLocation', required: true },
    timestamp: { type: Date, default: Date.now, required: true },
  },
  { timestamps: true }
);

// Index for faster lookups
RedemptionLogSchema.index({ voucherId: 1 });
RedemptionLogSchema.index({ merchantLocationId: 1 });
RedemptionLogSchema.index({ timestamp: -1 });

// Check if the model exists before creating it to prevent overwriting during hot reloads
export default mongoose.models.RedemptionLog || mongoose.model<IRedemptionLog>('RedemptionLog', RedemptionLogSchema);
