import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
    maintenanceMode: {
        type: Boolean,
        default: false,
    },
    bypassPassword: {
        type: String,
        default: '',
    },
}, { timestamps: true });

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
