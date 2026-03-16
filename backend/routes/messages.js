const router = require('express').Router();
const { sendMessage, getConversation, getConversations } = require('../controllers/messageController');
const { auth } = require('../middleware/auth');

router.post('/', auth, sendMessage);
router.get('/', auth, getConversations);
router.get('/:userId', auth, getConversation);

module.exports = router;
