
// types/merchant.ts mein CafeLocationFormData add karo
export interface CafeLocationFormData {
  name: string;
  address: string;
  city: string;
  county: string;
  area: string;
  customArea?: string;
  zipCode: string;
  country: string;
  phoneNumber?: string;
  openingHours: IOpeningHours;
  accessibility: IAccessibility;
}

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

export interface MerchantLocation {
  _id: string;
  merchantId: string;
  name: string;
  address: string;
  city: string;
  county: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
  phoneNumber?: string;
  openingHours?: IOpeningHours;
  accessibility?: IAccessibility;
  area: string;
  customArea?: string; // Optional field for custom area
  createdAt: string;
  updatedAt: string;
}

export interface Merchant {
  _id: string;
  name: string;
  description: string;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  address: string;
  county: string;
  businessCategory: 'Café & Treats' | 'Tickets & Passes' | 'Dining & Meals' | 'Other';
  locations: MerchantLocation[];
  status: 'pending' | 'approved' | 'denied';
  tags: string[];
  payoutDetails: {
    accountHolderName: string;
    iban: string;
    bic?: string;
  };
  tempPassword?: string;
  isActive: boolean;
  stripeConnectSettings?: {
    accountId?: string;
    isConnected: boolean;
    onboardingCompleted: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
  };
  brontieFeeSettings?: {
    isActive: boolean;
    activatedAt?: string;
    deactivatedAt?: string;
    deactivatedBy?: string;
    deactivationReason?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MerchantFormData {
  name: string;
  description: string;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  address: string;
  businessCategory: 'Café & Treats' | 'Tickets & Passes' | 'Dining & Meals' | 'Other';
}

export interface LocationFormData {
  name: string;
  address: string;
  city: string;
  county: string;
  zipCode: string;
  country: string;
  latitude?: string;
  longitude?: string;
  photoUrl?: string;
  phoneNumber: string;
  openingHours: IOpeningHours;
  accessibility: IAccessibility;
  area: string;
  customArea?: string; // Optional field for custom area
}
