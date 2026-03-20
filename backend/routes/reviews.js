const router = require('express').Router();
const { createReview, getBookReviews } = require('../controllers/reviewController');
const { auth } = require('../middleware/auth');

router.get('/book/:bookId', getBookReviews);
router.post('/donation/:donationId', auth, createReview);

module.exports = router;
