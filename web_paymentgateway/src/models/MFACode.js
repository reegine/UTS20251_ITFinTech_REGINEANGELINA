import mongoose from 'mongoose';

const mfaCodeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  code: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['whatsapp', 'email'],
    default: 'whatsapp'
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 600 }
  },
  used: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

mfaCodeSchema.index({ user: 1, used: 1 });

export default mongoose.models.MFACode || mongoose.model('MFACode', mfaCodeSchema);