const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const { initializeDatabase } = require('./config/database');
const { auth } = require('./middleware/auth');
const Chat = require('./models/Chat');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const listingRoutes = require('./routes/listings');
const chatRoutes = require('./routes/chat'); // New chat routes

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/chat', chatRoutes); 

// Health check endpoint
app.get('/api/health', (req, res) => { // endpoint to verify the server is running and responsive
  res.json({ 
    status: 'OK', 
    message: 'FindersNotKeepers server with chat is running',
    timestamp: new Date().toISOString()
  });
});

// WebSocket Connection Handling (Network side)
io.use((socket, next) => {
  // Simple authentication - you might want to use JWT here
  const token = socket.handshake.auth.token;
  if (token) {
    // Verify JWT token here if needed
    next();
  } else {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a chat room (typically item-specific room)
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
    
    // Notify others in the room
    socket.to(roomId).emit('user_joined', {
      userId: socket.id,
      roomId: roomId,
      timestamp: new Date()
    });
  });

  // Leave a chat room
  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.id} left room: ${roomId}`);
  });

  // Handle sending messages
  socket.on('send_message', async (data) => {
    try {
      const { roomId, userId, message, userName } = data;
      
      // Save message to database
      const messageData = {
        room_id: roomId,
        user_id: userId,
        message: message
      };

      const savedMessage = await Chat.create(messageData);

      // Broadcast message to everyone in the room
      io.to(roomId).emit('receive_message', {
        id: savedMessage.id,
        room_id: savedMessage.room_id,
        user_id: savedMessage.user_id,
        user_name: userName,
        message: savedMessage.message,
        created_at: savedMessage.created_at
      });

      console.log(`Message sent in room ${roomId} by user ${userId}`);

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message_error', {
        error: 'Failed to send message'
      });
    }
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    const { roomId, userName } = data;
    socket.to(roomId).emit('user_typing', {
      userName: userName,
      roomId: roomId
    });
  });

  socket.on('typing_stop', (data) => {
    const { roomId } = data;
    socket.to(roomId).emit('user_stop_typing', {
      roomId: roomId
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 5000;

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`💬 WebSocket server active`);
      console.log(`🏠 Environment: ${process.env.NODE_ENV}`);
      console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, io }; // Export for testing