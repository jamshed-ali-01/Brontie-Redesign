import mongoose, { Schema, Document } from 'mongoose';

export interface ICounterCardOrder extends Document {
  merchantId: mongoose.Types.ObjectId;
  locationId?: mongoose.Types.ObjectId | 'all';
  sendToAll: boolean;
  status: 'pending' | 'shipped' | 'delivered';
  createdAt: Date;
  updatedAt: Date;
}

const CounterCardOrderSchema: Schema = new Schema(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    locationId: { type: Schema.Types.Mixed, default: 'all' },
    sendToAll: { type: Boolean, default: false },
    status: { 
      type: String, 
      enum: ['pending', 'shipped', 'delivered'], 
      default: 'pending' 
    },
  },
  { timestamps: true }
);

export default mongoose.models.CounterCardOrder || mongoose.model<ICounterCardOrder>('CounterCardOrder', CounterCardOrderSchema);
