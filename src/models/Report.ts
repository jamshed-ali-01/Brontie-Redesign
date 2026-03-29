import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  merchantId: mongoose.Types.ObjectId;
  invoiceNumber: number;
  reportPeriod: {
    from: Date;
    to: Date;
  };
  pdfBuffer: Buffer;
  fileName: string;
  emailSent: boolean;
  recipientEmail?: string;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema: Schema = new Schema(
  {
    merchantId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Merchant', 
      required: true,
      index: true
    },
    invoiceNumber: { 
      type: Number, 
      required: true,
      unique: true,
      index: true
    },
    reportPeriod: {
      from: { type: Date, required: true },
      to: { type: Date, required: true }
    },
    pdfBuffer: { 
      type: Buffer, 
      required: true 
    },
    fileName: { 
      type: String, 
      required: true 
    },
    emailSent: { 
      type: Boolean, 
      default: false 
    },
    recipientEmail: { 
      type: String 
    },
    sentAt: { 
      type: Date 
    }
  },
  { timestamps: true }
);

// Indexes for faster lookups
ReportSchema.index({ merchantId: 1, createdAt: -1 });
ReportSchema.index({ invoiceNumber: 1 });

export default mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);

