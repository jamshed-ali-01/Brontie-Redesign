import mongoose, { Schema, Document } from 'mongoose';

export interface IGenericQRCode extends Document {
  shortId: string;
  type: 'homepage' | 'products' | 'custom';
  targetUrl: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  expiresAt: Date;
  scanCount: number;
  lastScannedAt?: Date;
}

const GenericQRCodeSchema = new Schema<IGenericQRCode>({
  shortId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    enum: ['homepage', 'products', 'custom'],
    required: true
  },
  targetUrl: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000) // 5 years from now
  },
  scanCount: {
    type: Number,
    default: 0
  },
  lastScannedAt: {
    type: Date
  }
});

// Create index for automatic cleanup of expired QR codes
GenericQRCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.GenericQRCode || mongoose.model<IGenericQRCode>('GenericQRCode', GenericQRCodeSchema);

