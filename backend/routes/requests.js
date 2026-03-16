const router = require('express').Router();
const { createRequest, getUserRequests, getDonorRequests, respondToRequest } = require('../controllers/requestController');
const { auth } = require('../middleware/auth');

router.post('/', auth, createRequest);
router.get('/user', auth, getUserRequests);
router.get('/donor', auth, getDonorRequests);
router.put('/:id/respond', auth, respondToRequest);

module.exports = router;
