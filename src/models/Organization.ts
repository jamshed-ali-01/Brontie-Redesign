import mongoose, { Schema, model, models } from "mongoose";

export interface IOrganization {
  name: string;
  slug: string;
  redirectSlugs?: string[];
  email?: string;
  description?: string;
  phone?: string;
  website?: string;
  address?: string;
  logoUrl?: string;
  coverImageUrl?: string; // ✅ NEW
  status: "active" | "inactive";
  password?: string;
  favoriteMerchantId?: mongoose.Types.ObjectId;
  qrImageUrl?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    redirectSlugs: { type: [String], default: [], index: true },
    email: { type: String, lowercase: true, index: true },
    description: String,
    phone: String,
    website: String,
    address: String,
    logoUrl: String,
    coverImageUrl: String, // ✅ NEW
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    password: String,
    favoriteMerchantId: { type: Schema.Types.ObjectId, ref: "Merchant", default: null },
    qrImageUrl: { type: String },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null }
  },
  { timestamps: true }
);

const Organization =
  (models.Organization as mongoose.Model<IOrganization>) ||
  model<IOrganization>("Organization", OrganizationSchema);

export default Organization;
