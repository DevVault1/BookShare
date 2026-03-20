const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  donationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation', required: true, unique: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookRating: { type: Number, required: true, min: 1, max: 5 },
  reviewText: { type: String, trim: true, maxlength: 1000, default: '' },
  donorFeedbackRating: { type: Number, required: true, min: 1, max: 5 },
  descriptionAccuracyRating: { type: Number, required: true, min: 1, max: 5 },
}, { timestamps: true });

reviewSchema.index({ bookId: 1, createdAt: -1 });
reviewSchema.index({ donorId: 1, createdAt: -1 });
reviewSchema.index({ receiverId: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
