import mongoose, { Schema, Document } from 'mongoose';

export interface IOpeningHours {
  monday: { open: string; close: string; closed: boolean };
  tuesday: { open: string; close: string; closed: boolean };
  wednesday: { open: string; close: string; closed: boolean };
  thursday: { open: string; close: string; closed: boolean };
  friday: { open: string; close: string; closed: boolean };
  saturday: { open: string; close: string; closed: boolean };
  sunday: { open: string; close: string; closed: boolean };
}

export interface IAccessibility {
  wheelchairAccessible: boolean;
  childFriendly: boolean;
  petFriendly: boolean;
  parkingAvailable: boolean;
  wifiAvailable: boolean;
  outdoorSeating: boolean;
  deliveryAvailable: boolean;
  takeawayAvailable: boolean;
  reservationsRequired: boolean;
  smokingAllowed: boolean;
}

export interface IMerchantLocation extends Document {
  merchantId: mongoose.Types.ObjectId;
  name: string;
  address: string;
  city?: string;
  county: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
  phoneNumber?: string;
  openingHours?: IOpeningHours;
  accessibility?: IAccessibility;
  isActive: boolean;
  area?: string;
  customArea?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OpeningHoursSchema = new Schema({
  monday: { open: String, close: String, closed: { type: Boolean, default: false } },
  tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
  wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
  thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
  friday: { open: String, close: String, closed: { type: Boolean, default: false } },
  saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
  sunday: { open: String, close: String, closed: { type: Boolean, default: false } }
}, { _id: false });

const AccessibilitySchema = new Schema({
  wheelchairAccessible: { type: Boolean, default: false },
  childFriendly: { type: Boolean, default: false },
  petFriendly: { type: Boolean, default: false },
  parkingAvailable: { type: Boolean, default: false },
  wifiAvailable: { type: Boolean, default: false },
  outdoorSeating: { type: Boolean, default: false },
  deliveryAvailable: { type: Boolean, default: false },
  takeawayAvailable: { type: Boolean, default: false },
  reservationsRequired: { type: Boolean, default: false },
  smokingAllowed: { type: Boolean, default: false }
}, { _id: false });

const MerchantLocationSchema: Schema = new Schema(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, default: '' },
    county: {
      type: String,
      required: true,
      enum: ['Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway', 'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick', 'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly', 'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath', 'Wexford', 'Wicklow'],
      default: 'Dublin'
    },
    area: { type: String, default: '' },
    customArea: { type: String, default: '' },
    zipCode: { type: String },
    country: { type: String, default: 'Ireland' },
    latitude: { type: Number },
    longitude: { type: Number },
    photoUrl: { type: String },
    phoneNumber: { type: String },
    openingHours: OpeningHoursSchema,
    accessibility: AccessibilitySchema,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index for faster lookups
MerchantLocationSchema.index({ merchantId: 1 });
MerchantLocationSchema.index({ isActive: 1 });
MerchantLocationSchema.index({ city: 1 });
MerchantLocationSchema.index({ county: 1 });
MerchantLocationSchema.index({ country: 1 });

export default mongoose.models.MerchantLocation || mongoose.model<IMerchantLocation>('MerchantLocation', MerchantLocationSchema);
