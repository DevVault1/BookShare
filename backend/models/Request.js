const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  message: { type: String, default: '' },
  requestDate: { type: Date, default: Date.now },
  responseDate: { type: Date },
  responseNote: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);
