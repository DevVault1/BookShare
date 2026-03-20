const router = require('express').Router();
const {
  startConversation,
  sendMessage,
  getConversations,
  getConversationMessages,
  markConversationRead,
} = require('../controllers/messageController');
const { auth } = require('../middleware/auth');

router.post('/conversations/start', auth, startConversation);
router.get('/conversations', auth, getConversations);
router.get('/conversations/:conversationId/messages', auth, getConversationMessages);
router.put('/conversations/:conversationId/read', auth, markConversationRead);
router.post('/', auth, sendMessage);

module.exports = router;
