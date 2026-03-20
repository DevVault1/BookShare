const mongoose = require('mongoose');
const Donation = require('../models/Donation');
const Notification = require('../models/Notification');
const Review = require('../models/Review');
const { recalculateBookRatings, recalculateDonorReputation, roundTo } = require('../utils/reputation');

const normalizeRating = (value) => Number(value);
const normalizeText = (value) => String(value || '').trim();

const ensureObjectId = (value) => (typeof value === 'string' ? new mongoose.Types.ObjectId(value) : value);

const PUBLIC_REVIEW_MATCH = { reviewType: 'public' };
const PRIVATE_REVIEW_MATCH = {
  $or: [
    { reviewType: 'private' },
    { reviewType: { $exists: false } },
  ],
};

const buildPublicReviewSummary = async (bookId) => {
  const normalizedBookId = ensureObjectId(bookId);
  const [summary] = await Review.aggregate([
    { $match: { ...PUBLIC_REVIEW_MATCH, bookId: normalizedBookId } },
    {
      $group: {
        _id: '$bookId',
        bookRatingAverage: { $avg: '$bookRating' },
        reviewsCount: { $sum: 1 },
      },
    },
  ]);

  return {
    bookRatingAverage: roundTo(summary?.bookRatingAverage || 0, 1),
    reviewsCount: summary?.reviewsCount || 0,
  };
};

const isReviewOwner = (review, user) => {
  const userId = user?._id?.toString();
  if (!userId) return false;
  if (user?.role === 'admin') return true;

  const authorId = review.userId?._id?.toString?.() || review.userId?.toString?.();
  const receiverId = review.receiverId?._id?.toString?.() || review.receiverId?.toString?.();

  return authorId === userId || receiverId === userId;
};

const populatePublicReview = (query) => query.populate('userId', 'name profileImage');
const populatePrivateReview = (query) => query
  .populate('receiverId', 'name profileImage')
  .populate('donorId', 'name profileImage donorReputation');

exports.createPrivateReview = async (req, res) => {
  try {
    const bookRating = normalizeRating(req.body.bookRating);
    const donorFeedbackRating = normalizeRating(req.body.donorFeedbackRating);
    const descriptionAccuracyRating = normalizeRating(req.body.descriptionAccuracyRating);
    const reviewText = normalizeText(req.body.reviewText);

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
      return res.status(400).json({ message: 'A private review has already been submitted for this donation' });
    }

    const review = await Review.create({
      reviewType: 'private',
      donationId: donation._id,
      bookId: donation.bookId._id,
      userId: req.user._id,
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

    const donorReputation = await recalculateDonorReputation(donation.donorId._id);

    await Notification.create({
      userId: donation.donorId._id,
      message: `${donation.receiverId.name} left private feedback on the donation for "${donation.bookId.title}".`,
      type: 'donation',
      relatedId: donation._id,
      link: '/dashboard',
    });

    const populatedReview = await populatePrivateReview(Review.findById(review._id));

    res.status(201).json({
      review: populatedReview,
      donorReputation,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPublicBookReviews = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Math.min(50, Number(req.query.limit || 10));
    const bookId = req.params.bookId;

    const [reviews, total, summary, myReview] = await Promise.all([
      populatePublicReview(
        Review.find({ ...PUBLIC_REVIEW_MATCH, bookId })
          .sort({ updatedAt: -1, createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
      ),
      Review.countDocuments({ ...PUBLIC_REVIEW_MATCH, bookId }),
      buildPublicReviewSummary(bookId),
      populatePublicReview(Review.findOne({ ...PUBLIC_REVIEW_MATCH, bookId, userId: req.user._id })),
    ]);

    res.json({
      reviews,
      summary,
      myReview,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createPublicReview = async (req, res) => {
  try {
    const bookRating = normalizeRating(req.body.bookRating);
    const reviewText = normalizeText(req.body.reviewText);
    const bookId = req.params.bookId;

    if (!Number.isFinite(bookRating) || bookRating < 1 || bookRating > 5) {
      return res.status(400).json({ message: 'bookRating must be a number between 1 and 5' });
    }

    if (!reviewText) {
      return res.status(400).json({ message: 'A written comment is required for public reviews' });
    }

    const existing = await Review.findOne({ ...PUBLIC_REVIEW_MATCH, bookId, userId: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You have already submitted a public review for this book' });
    }

    const review = await Review.create({
      reviewType: 'public',
      bookId,
      userId: req.user._id,
      bookRating,
      reviewText,
    });

    const [summary, populatedReview] = await Promise.all([
      recalculateBookRatings(bookId),
      populatePublicReview(Review.findById(review._id)),
    ]);

    res.status(201).json({
      review: populatedReview,
      summary,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ message: 'You can only submit one public review per book' });
    }
    res.status(500).json({ message: err.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    if (!isReviewOwner(review, req.user)) {
      return res.status(403).json({ message: 'You can only edit your own reviews' });
    }

    const bookRating = normalizeRating(req.body.bookRating);
    const reviewText = normalizeText(req.body.reviewText);

    if (Number.isFinite(bookRating)) {
      if (bookRating < 1 || bookRating > 5) {
        return res.status(400).json({ message: 'bookRating must be a number between 1 and 5' });
      }
      review.bookRating = bookRating;
    }

    if (typeof req.body.reviewText !== 'undefined') {
      if (review.reviewType === 'public' && !reviewText) {
        return res.status(400).json({ message: 'A written comment is required for public reviews' });
      }
      review.reviewText = reviewText;
    }

    if (review.reviewType === 'private') {
      for (const field of ['donorFeedbackRating', 'descriptionAccuracyRating']) {
        if (typeof req.body[field] !== 'undefined') {
          const value = normalizeRating(req.body[field]);
          if (!Number.isFinite(value) || value < 1 || value > 5) {
            return res.status(400).json({ message: `${field} must be a number between 1 and 5` });
          }
          review[field] = value;
        }
      }
    }

    await review.save();

    const [bookRatingSummary, donorReputation] = await Promise.all([
      recalculateBookRatings(review.bookId),
      review.donorId ? recalculateDonorReputation(review.donorId) : null,
    ]);

    const populatedReview = review.reviewType === 'public'
      ? await populatePublicReview(Review.findById(review._id))
      : await populatePrivateReview(Review.findById(review._id));

    res.json({
      review: populatedReview,
      bookRatingSummary,
      donorReputation,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    if (!isReviewOwner(review, req.user)) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }

    if (review.reviewType === 'private' && review.donationId) {
      await Donation.findByIdAndUpdate(review.donationId, {
        $unset: { reviewId: 1, reviewedAt: 1 },
      });
    }

    await Review.findByIdAndDelete(review._id);

    const [bookRatingSummary, donorReputation] = await Promise.all([
      recalculateBookRatings(review.bookId),
      review.donorId ? recalculateDonorReputation(review.donorId) : null,
    ]);

    res.json({
      message: 'Review deleted successfully',
      bookRatingSummary,
      donorReputation,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getReviewContext = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    if (review.reviewType === 'public') {
      if (!req.user) return res.status(401).json({ message: 'Authentication required' });
      const populatedReview = await populatePublicReview(Review.findById(review._id));
      return res.json(populatedReview);
    }

    const donation = review.donationId
      ? await Donation.findById(review.donationId)
      : null;

    const isAllowed = req.user?.role === 'admin'
      || review.receiverId?.toString() === req.user?._id?.toString()
      || review.donorId?.toString() === req.user?._id?.toString()
      || donation?.donorId?.toString() === req.user?._id?.toString()
      || donation?.receiverId?.toString() === req.user?._id?.toString();

    if (!isAllowed) {
      return res.status(403).json({ message: 'Not authorized to view this private review' });
    }

    const populatedReview = await populatePrivateReview(Review.findById(review._id));
    res.json(populatedReview);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.reviewQueryScopes = {
  PUBLIC_REVIEW_MATCH,
  PRIVATE_REVIEW_MATCH,
};
