const mongoose = require('mongoose');
const Donation = require('../models/Donation');
const Notification = require('../models/Notification');
const Review = require('../models/Review');
const { recalculateBookRatings, recalculateDonorReputation, roundTo } = require('../utils/reputation');

const normalizeRating = (value) => Number(value);

const buildReviewSummary = async (bookId) => {
  const normalizedBookId = typeof bookId === 'string' ? new mongoose.Types.ObjectId(bookId) : bookId;
  const [summary] = await Review.aggregate([
    { $match: { bookId: normalizedBookId } },
    {
      $group: {
        _id: '$bookId',
        bookRatingAverage: { $avg: '$bookRating' },
        donorFeedbackAverage: { $avg: '$donorFeedbackRating' },
        descriptionAccuracyAverage: { $avg: '$descriptionAccuracyRating' },
        reviewsCount: { $sum: 1 },
      },
    },
  ]);

  return {
    bookRatingAverage: roundTo(summary?.bookRatingAverage || 0, 1),
    donorFeedbackAverage: roundTo(summary?.donorFeedbackAverage || 0, 1),
    descriptionAccuracyAverage: roundTo(summary?.descriptionAccuracyAverage || 0, 1),
    reviewsCount: summary?.reviewsCount || 0,
  };
};

exports.createReview = async (req, res) => {
  try {
    const bookRating = normalizeRating(req.body.bookRating);
    const donorFeedbackRating = normalizeRating(req.body.donorFeedbackRating);
    const descriptionAccuracyRating = normalizeRating(req.body.descriptionAccuracyRating);
    const reviewText = String(req.body.reviewText || '').trim();

    for (const [label, value] of Object.entries({ bookRating, donorFeedbackRating, descriptionAccuracyRating })) {
      if (!Number.isFinite(value) || value < 1 || value > 5) {
        return res.status(400).json({ message: `${label} must be a number between 1 and 5` });
      }
    }

    const donation = await Donation.findById(req.params.donationId)
      .populate('bookId', 'title')
      .populate('donorId', 'name')
      .populate('receiverId', 'name');

    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    const isReceiver = donation.receiverId._id.toString() === req.user._id.toString();
    if (!isReceiver && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the receiver can review this donation' });
    }

    if (!['delivered', 'confirmed'].includes(donation.status)) {
      return res.status(400).json({ message: 'A review can only be added after the receiver gets the book' });
    }

    if (donation.reviewId) {
      return res.status(400).json({ message: 'A review has already been submitted for this donation' });
    }

    const review = await Review.create({
      donationId: donation._id,
      bookId: donation.bookId._id,
      donorId: donation.donorId._id,
      receiverId: donation.receiverId._id,
      bookRating,
      donorFeedbackRating,
      descriptionAccuracyRating,
      reviewText,
    });

    donation.reviewId = review._id;
    donation.reviewedAt = new Date();
    if (!donation.confirmedAt) donation.confirmedAt = new Date();
    donation.status = 'confirmed';
    await donation.save();

    const [bookRatingSummary, donorReputation] = await Promise.all([
      recalculateBookRatings(donation.bookId._id),
      recalculateDonorReputation(donation.donorId._id),
    ]);

    await Notification.create({
      userId: donation.donorId._id,
      message: `${donation.receiverId.name} reviewed "${donation.bookId.title}" and left feedback on your donation experience.`,
      type: 'donation',
      relatedId: donation._id,
      link: `/books/${donation.bookId._id}`,
    });

    const populatedReview = await Review.findById(review._id)
      .populate('receiverId', 'name profileImage')
      .populate('donorId', 'name profileImage donorReputation');

    res.status(201).json({
      review: populatedReview,
      bookRatingSummary,
      donorReputation,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBookReviews = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const bookId = req.params.bookId;

    const [reviews, total, summary] = await Promise.all([
      Review.find({ bookId })
        .populate('receiverId', 'name profileImage')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Review.countDocuments({ bookId }),
      buildReviewSummary(bookId),
    ]);

    res.json({
      reviews,
      summary,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
