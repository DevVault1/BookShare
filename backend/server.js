const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const path = require('path');
const User = require('./models/User');
const Conversation = require('./models/Conversation');
const { setSocketServer } = require('./utils/socket');
const { normalizeId } = require('./utils/chat');

dotenv.config();

const app = express();
const server = http.createServer(app);
const allowedOrigins = (process.env.CLIENT_URLS || '*').split(',').map((origin) => origin.trim());
const io = new Server(server, {
  cors: { origin: allowedOrigins.includes('*') ? '*' : allowedOrigins, methods: ['GET', 'POST'] },
});

setSocketServer(io);

app.use(cors({ origin: allowedOrigins.includes('*') ? true : allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', require('./routes/auth'));
app.use('/api/books', require('./routes/books'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/admin', require('./routes/admin'));

io.use(async (socket, next) => {
  try {
    const rawToken = socket.handshake.auth?.token || socket.handshake.headers?.authorization || '';
    const token = String(rawToken).replace(/^Bearer\s+/i, '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.id).select('_id name role isActive');

    if (!user || !user.isActive) {
      return next(new Error('User not found or inactive'));
    }

    socket.user = { id: normalizeId(user._id), name: user.name, role: user.role };
    next();
  } catch (error) {
    next(new Error('Invalid socket token'));
  }
});

io.on('connection', (socket) => {
  socket.join(`user:${socket.user.id}`);
  console.log(`Socket connected: ${socket.id} for user ${socket.user.id}`);

  socket.on('conversation:join', async (conversationId) => {
    try {
      const conversation = await Conversation.findById(conversationId).select('participants');
      if (!conversation) {
        return socket.emit('chat:error', { message: 'Conversation not found.' });
      }

      const isParticipant = conversation.participants.some((participant) => normalizeId(participant) === socket.user.id);
      if (!isParticipant) {
        return socket.emit('chat:error', { message: 'You do not have access to this conversation.' });
      }

      socket.join(`conversation:${conversationId}`);
      socket.emit('conversation:joined', { conversationId });
    } catch (error) {
      socket.emit('chat:error', { message: 'Failed to join conversation room.' });
    }
  });

  socket.on('conversation:leave', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB error:', err));

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
