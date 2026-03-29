import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  password: string;
  role: 'admin';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    username: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true,
      lowercase: true
    },
    password: { 
      type: String, 
      required: true 
    },
    role: { 
      type: String, 
      enum: ['admin'], 
      default: 'admin' 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
  },
  { timestamps: true }
);

// Only apply indexes in a server context (not in Edge Runtime)
// This prevents the 'emitWarning is not a function' error in middleware
if (process.env.NEXT_RUNTIME !== 'edge') {
  // Index for faster lookups (username already has unique index)
  UserSchema.index({ isActive: 1 });
}

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
