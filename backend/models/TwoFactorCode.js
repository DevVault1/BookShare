const mongoose = require('mongoose');

const twoFactorCodeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  purpose: { type: String, enum: ['login', 'setup'], required: true },
  channel: { type: String, enum: ['email', 'sms'], required: true },
  destination: { type: String, required: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  usedAt: { type: Date, default: null },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

twoFactorCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
twoFactorCodeSchema.index({ userId: 1, purpose: 1, createdAt: -1 });

module.exports = mongoose.model('TwoFactorCode', twoFactorCodeSchema);
