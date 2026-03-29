import mongoose from 'mongoose';

const messageTemplateSchema = new mongoose.Schema({ 
  templateId: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  displayOrder: { type: Number, default: 0 },
}, {
  timestamps: true
});

export default mongoose.models.MessageTemplate || mongoose.model('MessageTemplate', messageTemplateSchema);