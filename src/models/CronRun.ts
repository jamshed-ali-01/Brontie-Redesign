import mongoose, { Schema, Document } from 'mongoose';

export interface ICronRun extends Document {
  name: string; // 'send-reports' | 'process-payouts'
  lastRunAt: Date;
  lastSuccessAt: Date;
  status: 'success' | 'failed' | 'skipped';
  runCount: number;
  periodStart?: Date; // For tracking 2-week periods
  periodEnd?: Date;
  notes?: string;
}

const CronRunSchema = new Schema<ICronRun>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    lastRunAt: {
      type: Date,
      required: true,
    },
    lastSuccessAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'skipped'],
      required: true,
    },
    runCount: {
      type: Number,
      default: 0,
    },
    periodStart: {
      type: Date,
    },
    periodEnd: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
CronRunSchema.index({ name: 1 });
CronRunSchema.index({ lastRunAt: -1 });

export default mongoose.models.CronRun || mongoose.model<ICronRun>('CronRun', CronRunSchema);
