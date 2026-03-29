import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IQRCode extends Document {
  _id: string;
  shortId: string;
  merchantId: Types.ObjectId;
  locationId: Types.ObjectId;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

const QRCodeSchema = new Schema<IQRCode>({
  shortId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  merchantId: {
    type: Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true
  },
  locationId: {
    type: Schema.Types.ObjectId,
    ref: 'MerchantLocation',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000) // 5 years from now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Create index for automatic cleanup of expired QR codes
QRCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.QRCode || mongoose.model<IQRCode>('QRCode', QRCodeSchema);
