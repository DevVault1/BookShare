const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  reviewType: { type: String, enum: ['public', 'private'], default: 'private' },
  donationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation' },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bookRating: { type: Number, required: true, min: 1, max: 5 },
  reviewText: { type: String, trim: true, maxlength: 1000, default: '' },
  donorFeedbackRating: { type: Number, min: 1, max: 5 },
  descriptionAccuracyRating: { type: Number, min: 1, max: 5 },
}, { timestamps: true });

reviewSchema.index(
  { donationId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      donationId: { $exists: true, $type: 'objectId' },
    },
  }
);
reviewSchema.index(
  { bookId: 1, userId: 1, reviewType: 1 },
  {
    unique: true,
    partialFilterExpression: {
      reviewType: 'public',
      userId: { $exists: true, $type: 'objectId' },
    },
  }
);
reviewSchema.index({ reviewType: 1, bookId: 1, createdAt: -1 });
reviewSchema.index({ donorId: 1, createdAt: -1 });
reviewSchema.index({ receiverId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
