const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['book', 'user', 'message', 'platform', 'other'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
  category: { type: String, enum: ['fake_listing', 'inappropriate_content', 'suspicious_user', 'harassment', 'spam', 'other'], required: true },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  status: { type: String, enum: ['pending', 'under_review', 'resolved', 'dismissed'], default: 'pending' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  adminNotes: { type: String, trim: true, default: '' },
  emailSentAt: { type: Date },
  resolvedAt: { type: Date },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reporterId: 1, createdAt: -1 });
reportSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
