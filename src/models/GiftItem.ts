  import mongoose, { Schema, Document } from "mongoose";

  export interface IGiftItem extends Document {
    merchantId: mongoose.Types.ObjectId;
    locationIds: mongoose.Types.ObjectId[];
    categoryId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    itemDisplayOrder: number;

     square_id?: string;
  square_name?: string;
  square_price?: number;
  lastSyncStatus?: string;
  }


  const GiftItemSchema: Schema = new Schema(
    {
      merchantId: {
        type: Schema.Types.ObjectId,
        ref: "Merchant",
        required: true,
      },
      locationIds: [{ type: Schema.Types.ObjectId, ref: "MerchantLocation" }],
      categoryId: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        required: true,
      },
      name: { type: String, required: true },
      description: { type: String, maxlength: 200 },
      price: {
        type: Number,
        required: true,
        min: 0.5,
        validate: {
          validator: function (v: number) {
            if (v < 0.5) return false;
            // Check if price is in €0.10 increments (more robust check)
            const priceInCents = Math.round(v * 100);
            return priceInCents % 10 === 0;
          },
          message: "Price must be at least €0.50 and in increments of €0.10",
        },
      },
      imageUrl: { type: String },
      isActive: { type: Boolean, default: true },

      itemDisplayOrder: { type: Number, default: 999 },

      square_id: { type: String, default: null },
    square_name: { type: String },
    square_price: { type: Number },
    lastSyncStatus: { type: String },
    },
    { timestamps: true }
  );

  // Index for faster lookups
  GiftItemSchema.index({ categoryId: 1, isActive: 1 });
  GiftItemSchema.index({ merchantId: 1, isActive: 1 });
  GiftItemSchema.index({ locationIds: 1 });
  GiftItemSchema.index({ price: 1 });

  GiftItemSchema.index({ square_id: 1 });

  export default mongoose.models.GiftItem ||
    mongoose.model<IGiftItem>("GiftItem", GiftItemSchema);
