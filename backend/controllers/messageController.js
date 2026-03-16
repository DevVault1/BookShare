const Message = require('../models/Message');

exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, message, bookId } = req.body;
    const msg = await Message.create({
      senderId: req.user._id, receiverId, message, bookId
    });
    const populated = await msg.populate('senderId', 'name profileImage');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await Message.find({
      $or: [
        { senderId: req.user._id, receiverId: userId },
        { senderId: userId, receiverId: req.user._id },
      ]
    })
      .populate('senderId', 'name profileImage')
      .sort({ createdAt: 1 });

    await Message.updateMany(
      { senderId: userId, receiverId: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ senderId: req.user._id }, { receiverId: req.user._id }]
    })
      .populate('senderId', 'name profileImage')
      .populate('receiverId', 'name profileImage')
      .sort({ createdAt: -1 });

    const conversationMap = new Map();
    messages.forEach(msg => {
      const otherId = msg.senderId._id.toString() === req.user._id.toString()
        ? msg.receiverId._id.toString()
        : msg.senderId._id.toString();

      if (!conversationMap.has(otherId)) {
        conversationMap.set(otherId, {
          user: msg.senderId._id.toString() === req.user._id.toString() ? msg.receiverId : msg.senderId,
          lastMessage: msg,
          unread: 0,
        });
      }
      if (msg.receiverId._id.toString() === req.user._id.toString() && !msg.isRead) {
        conversationMap.get(otherId).unread++;
      }
    });

    res.json(Array.from(conversationMap.values()));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
