import mongoose, { Schema, Document } from 'mongoose';

export interface ICounter extends Document {
  name: string;
  sequence: number;
}

const CounterSchema = new Schema<ICounter>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    sequence: {
      type: Number,
      required: true,
      default: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
CounterSchema.index({ name: 1 });

export default mongoose.models.Counter || mongoose.model<ICounter>('Counter', CounterSchema);
