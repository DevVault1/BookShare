const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request' },
  reviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Review' },
  donationDate: { type: Date, default: Date.now },
  deliveryMethod: { type: String, enum: ['pickup', 'mail', 'meetup'], default: 'meetup' },
  status: { type: String, enum: ['pending', 'delivered', 'confirmed'], default: 'pending' },
  notes: { type: String, default: '' },
  deliveredAt: { type: Date },
  confirmedAt: { type: Date },
  reviewedAt: { type: Date },
}, { timestamps: true });

donationSchema.index({ donorId: 1, receiverId: 1, createdAt: -1 });

module.exports = mongoose.model('Donation', donationSchema);
