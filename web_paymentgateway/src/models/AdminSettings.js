import mongoose from 'mongoose';

const adminSettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: String
}, {
  timestamps: true
});

adminSettingsSchema.index({ key: 1 });

export default mongoose.models.AdminSettings || mongoose.model('AdminSettings', adminSettingsSchema);