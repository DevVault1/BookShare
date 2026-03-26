const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['request', 'approval', 'rejection', 'message', 'donation', 'report', 'security', 'system'], default: 'system' },
  isRead: { type: Boolean, default: false },
  link: { type: String, default: '' },
  relatedId: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
