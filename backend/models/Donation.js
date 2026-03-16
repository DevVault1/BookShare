const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request' },
  donationDate: { type: Date, default: Date.now },
  deliveryMethod: { type: String, enum: ['pickup', 'mail', 'meetup'], default: 'meetup' },
  status: { type: String, enum: ['pending', 'delivered', 'confirmed'], default: 'pending' },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Donation', donationSchema);
