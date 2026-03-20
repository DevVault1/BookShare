const mongoose = require('mongoose');
const Book = require('../models/Book');
const Review = require('../models/Review');
const Request = require('../models/Request');
const User = require('../models/User');

const roundTo = (value, precision = 1) => {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const calculateResponseSpeedScore = (avgResponseHours) => {
  if (!avgResponseHours || avgResponseHours <= 0) return 0;
  if (avgResponseHours <= 6) return 5;
  if (avgResponseHours <= 12) return 4.8;
  if (avgResponseHours <= 24) return 4.5;
  if (avgResponseHours <= 48) return 4;
  if (avgResponseHours <= 72) return 3.5;
  if (avgResponseHours <= 120) return 3;
  if (avgResponseHours <= 168) return 2.5;
  return 2;
};

const weightedAverage = (parts) => {
  const valid = parts.filter((part) => Number.isFinite(part.value) && part.value > 0 && part.weight > 0);
  if (valid.length === 0) return 0;

  const totalWeight = valid.reduce((sum, part) => sum + part.weight, 0);
  const weighted = valid.reduce((sum, part) => sum + (part.value * part.weight), 0);
  return roundTo(weighted / totalWeight, 1);
};

const recalculateBookRatings = async (bookId) => {
  const normalizedBookId = typeof bookId === 'string' ? new mongoose.Types.ObjectId(bookId) : bookId;
  const [summary] = await Review.aggregate([
    { $match: { bookId: normalizedBookId } },
    {
      $group: {
        _id: '$bookId',
        ratingsAverage: { $avg: '$bookRating' },
        ratingsCount: { $sum: 1 },
        latestReviewAt: { $max: '$createdAt' },
      },
    },
  ]);

  const payload = summary
    ? {
        ratingsAverage: roundTo(summary.ratingsAverage, 1),
        ratingsCount: summary.ratingsCount,
        latestReviewAt: summary.latestReviewAt,
      }
    : {
        ratingsAverage: 0,
        ratingsCount: 0,
        latestReviewAt: null,
      };

  await Book.findByIdAndUpdate(normalizedBookId, payload, { new: true });
  return payload;
};

const recalculateDonorReputation = async (donorId) => {
  const [requestSummary] = await Request.aggregate([
    {
      $match: {
        donorId,
        responseDate: { $exists: true, $ne: null },
      },
    },
    {
      $project: {
        responseHours: {
          $divide: [
            { $subtract: ['$responseDate', '$createdAt'] },
            1000 * 60 * 60,
          ],
        },
      },
    },
    {
      $group: {
        _id: '$donorId',
        avgResponseHours: { $avg: '$responseHours' },
        respondedRequests: { $sum: 1 },
      },
    },
  ]);

  const [reviewSummary] = await Review.aggregate([
    { $match: { donorId } },
    {
      $group: {
        _id: '$donorId',
        accuracyScore: { $avg: '$descriptionAccuracyRating' },
        receiverFeedbackScore: { $avg: '$donorFeedbackRating' },
        totalReviewedDonations: { $sum: 1 },
      },
    },
  ]);

  const avgResponseHours = roundTo(requestSummary?.avgResponseHours || 0, 1);
  const responseSpeedScore = roundTo(calculateResponseSpeedScore(avgResponseHours), 1);
  const accuracyScore = roundTo(reviewSummary?.accuracyScore || 0, 1);
  const receiverFeedbackScore = roundTo(reviewSummary?.receiverFeedbackScore || 0, 1);

  const overallScore = clamp(
    weightedAverage([
      { value: responseSpeedScore, weight: 0.3 },
      { value: accuracyScore, weight: 0.35 },
      { value: receiverFeedbackScore, weight: 0.35 },
    ]),
    0,
    5
  );

  const donorReputation = {
    overallScore,
    responseSpeedScore,
    accuracyScore,
    receiverFeedbackScore,
    totalReviewedDonations: reviewSummary?.totalReviewedDonations || 0,
    respondedRequests: requestSummary?.respondedRequests || 0,
    avgResponseHours,
    lastCalculatedAt: new Date(),
  };

  await User.findByIdAndUpdate(donorId, { donorReputation }, { new: true });
  return donorReputation;
};

module.exports = {
  recalculateBookRatings,
  recalculateDonorReputation,
  roundTo,
};
