import mongoose, { Schema, Document } from "mongoose";

/* =========================
   Interface
========================= */
export interface IMerchant extends Document {
  name: string;
  description?: string;
  logoUrl?: string;
  brandingPhotoUrl?: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  address?: string;
  county?:
    | "Carlow"
    | "Cavan"
    | "Clare"
    | "Cork"
    | "Donegal"
    | "Dublin"
    | "Galway"
    | "Kerry"
    | "Kildare"
    | "Kilkenny"
    | "Laois"
    | "Leitrim"
    | "Limerick"
    | "Longford"
    | "Louth"
    | "Mayo"
    | "Meath"
    | "Monaghan"
    | "Offaly"
    | "Roscommon"
    | "Sligo"
    | "Tipperary"
    | "Waterford"
    | "Westmeath"
    | "Wexford"
    | "Wicklow";
  businessCategory?:
    | "Café & Treats"
    | "Tickets & Passes"
    | "Dining & Meals"
    | "Other";
  adminUserId?: string;
  isActive: boolean;
  status: "pending" | "approved" | "denied";
  tags: string[];
  payoutDetails?: {
    accountHolderName?: string;
    iban?: string;
    bic?: string;
  };
  tempPassword?: string;
  password?: string;

  stripeConnectSettings?: {
    accountId?: string;
    isConnected: boolean;
    onboardingCompleted: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
  };

  brontieFeeSettings?: {
    isActive?: boolean;
    activatedAt?: Date;
    deactivatedAt?: Date;
    deactivatedBy?: string;
    deactivationReason?: string;
    commissionRate: number;
    commissionActivateFrom?: Date;
  };

  displayOrder?: number;
  signupStep: number;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  magicLinkToken?: string;
  magicLinkExpires?: Date;

  locations?: any[]; // 👈 virtual populate
  createdAt: Date;
  updatedAt: Date;
}

/* =========================
   Schema
========================= */
const MerchantSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, maxlength: 500 },
    logoUrl: { type: String },
    brandingPhotoUrl: { type: String },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String },
    website: { type: String },
    address: { type: String, required: false, default: "" },

    county: {
      type: String,
      required: false,
      enum: [
        "Carlow",
        "Cavan",
        "Clare",
        "Cork",
        "Donegal",
        "Dublin",
        "Galway",
        "Kerry",
        "Kildare",
        "Kilkenny",
        "Laois",
        "Leitrim",
        "Limerick",
        "Longford",
        "Louth",
        "Mayo",
        "Meath",
        "Monaghan",
        "Offaly",
        "Roscommon",
        "Sligo",
        "Tipperary",
        "Waterford",
        "Westmeath",
        "Wexford",
        "Wicklow",
      ],
      default: "Dublin",
    },

    businessCategory: {
      type: String,
      required: false,
      enum: ["Café & Treats", "Tickets & Passes", "Dining & Meals", "Other"],
      default: "Café & Treats",
    },

    signupStep: { type: Number, default: 1 },

    adminUserId: { type: String },
    isActive: { type: Boolean, default: true },

    status: {
      type: String,
      enum: ["pending", "approved", "denied"],
      default: "pending",
    },

    tags: [{ type: String }],

    payoutDetails: {
      accountHolderName: String,
      iban: String,
      bic: String,
    },

    tempPassword: String,
    password: String,

    stripeConnectSettings: {
      accountId: String,
      isConnected: { type: Boolean, default: false },
      onboardingCompleted: { type: Boolean, default: false },
      chargesEnabled: { type: Boolean, default: false },
      payoutsEnabled: { type: Boolean, default: false },
      detailsSubmitted: { type: Boolean, default: false },
    },

    brontieFeeSettings: {
      isActive: { type: Boolean, default: false },
      commissionRate: { type: Number, default: 0.1 },
      commissionActivateFrom: Date,
      activatedAt: Date,
      deactivatedAt: Date,
      deactivatedBy: String,
      deactivationReason: String,
    },

    displayOrder: { type: Number, default: 999 },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    magicLinkToken: String,
    magicLinkExpires: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },   // ✅ CORRECT PLACE
    toObject: { virtuals: true }, // ✅ CORRECT PLACE
  }
);

/* =========================
   Virtual Populate
========================= */
MerchantSchema.virtual("locations", {
  ref: "MerchantLocation", // 👈 EXACT model name
  localField: "_id",
  foreignField: "merchantId",
});

/* =========================
   Indexes
========================= */
MerchantSchema.index({ adminUserId: 1 });
MerchantSchema.index({ isActive: 1 });
MerchantSchema.index({ status: 1 });
MerchantSchema.index({ tags: 1 });
MerchantSchema.index({ county: 1 });

/* =========================
   Export
========================= */
// Clean up models in development to prevent schema caching issues
if (process.env.NODE_ENV === "development") {
  delete (mongoose.models as any).Merchant;
}

export default mongoose.models.Merchant ||
  mongoose.model<IMerchant>("Merchant", MerchantSchema);
