const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Book = require('../models/Book');
const Notification = require('../models/Notification');
const { getSocketServer } = require('../utils/socket');
const { buildConversationKey, normalizeId } = require('../utils/chat');

const conversationPopulate = [
  { path: 'participants', select: 'name profileImage role location donorReputation' },
  { path: 'bookId', select: 'title author image status donorId' },
  { path: 'lastMessageSenderId', select: 'name profileImage' },
];

const messagePopulate = [
  { path: 'senderId', select: 'name profileImage role' },
  { path: 'receiverId', select: 'name profileImage role' },
  { path: 'bookId', select: 'title author image status donorId' },
];

function serializeConversation(conversation, currentUserId) {
  const currentId = normalizeId(currentUserId);
  const participants = Array.isArray(conversation.participants) ? conversation.participants : [];
  const otherUser = participants.find((participant) => normalizeId(participant) !== currentId) || null;
  const unreadCounts = typeof conversation.unreadCounts?.toObject === 'function'
    ? conversation.unreadCounts.toObject()
    : (conversation.unreadCounts || {});

  return {
    _id: conversation._id,
    conversationKey: conversation.participantKey,
    user: otherUser,
    book: conversation.bookId || null,
    lastMessage: conversation.lastMessage,
    lastMessageAt: conversation.lastMessageAt,
    lastMessageSenderId: conversation.lastMessageSenderId,
    unreadCount: unreadCounts[currentId] || 0,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

async function emitConversationUpdate(conversation, participantsToNotify = []) {
  const io = getSocketServer();
  if (!io || !conversation) return;

  const populatedConversation = await Conversation.findById(conversation._id).populate(conversationPopulate);
  if (!populatedConversation) return;

  const participantIds = participantsToNotify.length
    ? participantsToNotify.map(normalizeId)
    : populatedConversation.participants.map((participant) => normalizeId(participant));

  participantIds.forEach((participantId) => {
    io.to(`user:${participantId}`).emit('conversation:updated', serializeConversation(populatedConversation, participantId));
  });
}

async function touchConversationReadState(conversation, currentUserId) {
  const currentId = normalizeId(currentUserId);
  const unreadCounts = typeof conversation.unreadCounts?.toObject === 'function'
    ? conversation.unreadCounts.toObject()
    : (conversation.unreadCounts || {});

  if (!unreadCounts[currentId]) {
    return conversation;
  }

  const now = new Date();
  await Message.updateMany(
    { conversationId: conversation._id, receiverId: currentUserId, isRead: false },
    { $set: { isRead: true, readAt: now } }
  );

  conversation.unreadCounts.set(currentId, 0);
  await conversation.save();

  const io = getSocketServer();
  if (io) {
    io.to(`conversation:${conversation._id}`).emit('conversation:read', {
      conversationId: conversation._id,
      userId: currentId,
      readAt: now,
    });
  }

  await emitConversationUpdate(conversation);
  return conversation;
}

async function resolveConversation({ currentUserId, receiverId, bookId, createIfMissing = true }) {
  const currentId = normalizeId(currentUserId);
  const otherId = normalizeId(receiverId);
  const normalizedBookId = normalizeId(bookId) || null;

  if (!otherId) {
    const error = new Error('Receiver is required.');
    error.status = 400;
    throw error;
  }

  if (currentId === otherId) {
    const error = new Error('You cannot message yourself.');
    error.status = 400;
    throw error;
  }

  const receiver = await User.findById(otherId).select('_id name role');
  if (!receiver) {
    const error = new Error('Receiver not found.');
    error.status = 404;
    throw error;
  }

  let book = null;
  if (normalizedBookId) {
    book = await Book.findById(normalizedBookId).select('_id title donorId');
    if (!book) {
      const error = new Error('Book not found for this chat.');
      error.status = 404;
      throw error;
    }
  }

  const participantKey = buildConversationKey(currentId, otherId, normalizedBookId);
  let conversation = await Conversation.findOne({ participantKey });

  if (!conversation && createIfMissing) {
    conversation = await Conversation.create({
      participantKey,
      participants: [currentId, otherId],
      bookId: normalizedBookId,
      createdBy: currentId,
      unreadCounts: {
        [currentId]: 0,
        [otherId]: 0,
      },
    });
  }

  if (!conversation) {
    const error = new Error('Conversation not found.');
    error.status = 404;
    throw error;
  }

  return conversation;
}

exports.startConversation = async (req, res) => {
  try {
    const { receiverId, bookId } = req.body;
    const conversation = await resolveConversation({
      currentUserId: req.user._id,
      receiverId,
      bookId,
      createIfMissing: true,
    });

    const populated = await Conversation.findById(conversation._id).populate(conversationPopulate);
    res.json(serializeConversation(populated, req.user._id));
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to start conversation' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, message, bookId, conversationId } = req.body;
    const trimmedMessage = String(message || '').trim();

    if (!trimmedMessage) {
      return res.status(400).json({ message: 'Message cannot be empty.' });
    }

    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.participants.some((participant) => normalizeId(participant) === normalizeId(req.user._id))) {
        return res.status(404).json({ message: 'Conversation not found.' });
      }
    } else {
      conversation = await resolveConversation({
        currentUserId: req.user._id,
        receiverId,
        bookId,
        createIfMissing: true,
      });
    }

    const participantIds = conversation.participants.map((participant) => normalizeId(participant));
    const resolvedReceiverId = receiverId
      ? normalizeId(receiverId)
      : participantIds.find((participantId) => participantId !== normalizeId(req.user._id));

    const createdMessage = await Message.create({
      conversationId: conversation._id,
      conversationKey: conversation.participantKey,
      senderId: req.user._id,
      receiverId: resolvedReceiverId,
      message: trimmedMessage,
      bookId: conversation.bookId || (normalizeId(bookId) || null),
    });

    conversation.lastMessage = trimmedMessage;
    conversation.lastMessageAt = createdMessage.createdAt;
    conversation.lastMessageSenderId = req.user._id;

    const currentUnreadCounts = typeof conversation.unreadCounts?.toObject === 'function'
      ? conversation.unreadCounts.toObject()
      : (conversation.unreadCounts || {});

    conversation.unreadCounts.set(normalizeId(req.user._id), 0);
    conversation.unreadCounts.set(resolvedReceiverId, (currentUnreadCounts[resolvedReceiverId] || 0) + 1);
    await conversation.save();

    const populatedMessage = await Message.findById(createdMessage._id).populate(messagePopulate);

    await Notification.create({
      userId: resolvedReceiverId,
      message: `${req.user.name} sent you a new message${conversation.bookId ? ' about a book' : ''}.`,
      type: 'message',
      link: `/dashboard/chat?conversationId=${conversation._id}`,
      relatedId: conversation._id,
    }).catch(() => null);

    await emitConversationUpdate(conversation, [req.user._id, resolvedReceiverId]);

    const io = getSocketServer();
    if (io) {
      io.to(`conversation:${conversation._id}`).emit('message:new', populatedMessage);
      io.to(`user:${resolvedReceiverId}`).emit('message:incoming', {
        conversationId: conversation._id,
        message: populatedMessage,
      });
    }

    res.status(201).json(populatedMessage);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to send message' });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate(conversationPopulate)
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    res.json(conversations.map((conversation) => serializeConversation(conversation, req.user._id)));
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch conversations' });
  }
};


exports.markConversationRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    let conversation = await Conversation.findById(conversationId).populate(conversationPopulate);

    if (!conversation || !conversation.participants.some((participant) => normalizeId(participant) === normalizeId(req.user._id))) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    conversation = await touchConversationReadState(conversation, req.user._id);
    const refreshedConversation = await Conversation.findById(conversationId).populate(conversationPopulate);

    res.json({
      conversation: serializeConversation(refreshedConversation || conversation, req.user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to update read status' });
  }
};

exports.getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    let conversation = await Conversation.findById(conversationId).populate(conversationPopulate);

    if (!conversation || !conversation.participants.some((participant) => normalizeId(participant) === normalizeId(req.user._id))) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    const messages = await Message.find({ conversationId })
      .populate(messagePopulate)
      .sort({ createdAt: 1 });

    conversation = await touchConversationReadState(conversation, req.user._id);
    const refreshedConversation = await Conversation.findById(conversationId).populate(conversationPopulate);

    res.json({
      conversation: serializeConversation(refreshedConversation || conversation, req.user._id),
      messages,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch messages' });
  }
};
