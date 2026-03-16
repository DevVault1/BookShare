const router = require('express').Router();
const { getDonations, updateDonationStatus } = require('../controllers/donationController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getDonations);
router.put('/:id/status', auth, updateDonationStatus);

module.exports = router;
