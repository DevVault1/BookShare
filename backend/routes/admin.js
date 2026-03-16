const router = require('express').Router();
const { getStats, getAllUsers, updateUser, deleteUser, getAllBooks, getAllRequests } = require('../controllers/adminController');
const { adminAuth } = require('../middleware/auth');

router.get('/stats', adminAuth, getStats);
router.get('/users', adminAuth, getAllUsers);
router.put('/users/:id', adminAuth, updateUser);
router.delete('/users/:id', adminAuth, deleteUser);
router.get('/books', adminAuth, getAllBooks);
router.get('/requests', adminAuth, getAllRequests);

module.exports = router;
