const router = require('express').Router();
const { getNotifications, markRead } = require('../controllers/notificationController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getNotifications);
router.put('/mark-read', auth, markRead);

module.exports = router;
