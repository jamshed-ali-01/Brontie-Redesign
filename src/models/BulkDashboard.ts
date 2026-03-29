import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IBulkDashboard extends Document {
  ownerEmail: string;
  defaultSenderName?: string;
  defaultMessage?: string;
  magicLinkToken: string;
  passcode?: string; // Optional hashed passcode
  admins: string[]; // List of emails that can access
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date; // To track account age/usage
}

const BulkDashboardSchema = new Schema<IBulkDashboard>(
  {
    ownerEmail: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
    },
    defaultSenderName: {
      type: String,
      default: "",
    },
    defaultMessage: {
      type: String,
      default: "",
    },
    magicLinkToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    passcode: {
      type: String,
      default: null,
    },
    admins: {
      type: [String],
      default: [],
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes for faster lookups
BulkDashboardSchema.index({ ownerEmail: 1 });
BulkDashboardSchema.index({ magicLinkToken: 1 });

const BulkDashboard =
  (models.BulkDashboard as mongoose.Model<IBulkDashboard>) ||
  model<IBulkDashboard>("BulkDashboard", BulkDashboardSchema);

export default BulkDashboard;
