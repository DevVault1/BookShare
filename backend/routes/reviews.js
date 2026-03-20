const router = require('express').Router();
const {
  createPrivateReview,
  getPublicBookReviews,
  createPublicReview,
  updateReview,
  deleteReview,
  getReviewContext,
} = require('../controllers/reviewController');
const { auth } = require('../middleware/auth');

router.get('/public/book/:bookId', auth, getPublicBookReviews);
router.post('/public/book/:bookId', auth, createPublicReview);
router.get('/:reviewId', auth, getReviewContext);
router.put('/:reviewId', auth, updateReview);
router.delete('/:reviewId', auth, deleteReview);
router.post('/donation/:donationId', auth, createPrivateReview);

module.exports = router;
