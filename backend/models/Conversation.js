const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participantKey: { type: String, required: true, unique: true, index: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lastMessage: { type: String, default: '' },
  lastMessageAt: { type: Date, default: Date.now, index: true },
  lastMessageSenderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  unreadCounts: {
    type: Map,
    of: Number,
    default: {},
  },
}, { timestamps: true });

conversationSchema.index({ participants: 1, lastMessageAt: -1 });
conversationSchema.index({ bookId: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
