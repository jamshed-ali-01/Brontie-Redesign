// models/RedeemedPeriodReset.js
import mongoose from 'mongoose';

const redeemedPeriodResetSchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true
  },
  resetAt: {
    type: Date,
    default: Date.now
  },
  resetBy: {
    type: String, // 'admin' ya 'system'
    default: 'admin'
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for faster queries
redeemedPeriodResetSchema.index({ merchantId: 1, resetAt: -1 });

export default mongoose.models.RedeemedPeriodReset || 
       mongoose.model('RedeemedPeriodReset', redeemedPeriodResetSchema);