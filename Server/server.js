const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { pool, initialiseDatabase } = require('./config/database');
const { auth, adminAuth } = require('./middleware/auth'); // Added adminAuth import
const Chat = require('./models/Chat');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const listingRoutes = require('./routes/listings');
const chatRoutes = require('./routes/chat');

const app = express();
const server = http.createServer(app);

// Allowed origins for CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:5173",
  "https://findersnotkeepers.onrender.com",
  "https://findersnotkeepers-frontend.onrender.com"
].filter(Boolean);

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true
}));
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
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'FindersNotKeepers server with chat is running',
    timestamp: new Date().toISOString()
  });
});

// Enhanced Search with multiple filters
app.get('/api/search/enhanced', async (req, res) => {
  try {
    const { 
      query, 
      category, 
      item_type, 
      location, 
      date_from, 
      date_to,
      status,
      radius,
      lat,
      lng 
    } = req.query;

    let searchQuery = `
      SELECT l.*, u.name as user_name, u.email as user_email,
        (SELECT COUNT(*) FROM chats c WHERE c.room_id = l.id::text) as message_count
      FROM listings l 
      JOIN users u ON l.user_id = u.id 
      WHERE 1=1
    `;
    
    const values = [];
    let paramCount = 0;

    if (query) {
      paramCount++;
      searchQuery += ` AND (l.title ILIKE $${paramCount} OR l.description ILIKE $${paramCount})`;
      values.push(`%${query}%`);
    }

    if (category) {
      paramCount++;
      searchQuery += ` AND l.category = $${paramCount}`;
      values.push(category);
    }

    if (item_type) {
      paramCount++;
      searchQuery += ` AND l.item_type = $${paramCount}`;
      values.push(item_type);
    }

    if (location) {
      paramCount++;
      searchQuery += ` AND l.location ILIKE $${paramCount}`;
      values.push(`%${location}%`);
    }

    if (date_from) {
      paramCount++;
      searchQuery += ` AND l.date_lost_found >= $${paramCount}`;
      values.push(date_from);
    }

    if (date_to) {
      paramCount++;
      searchQuery += ` AND l.date_lost_found <= $${paramCount}`;
      values.push(date_to);
    }

    if (status) {
      paramCount++;
      searchQuery += ` AND l.status = $${paramCount}`;
      values.push(status);
    }

    searchQuery += ' ORDER BY l.created_at DESC LIMIT 100';

    const result = await pool.query(searchQuery, values);
    
    res.json({
      success: true,
      count: result.rows.length,
      listings: result.rows
    });
  } catch (error) {
    console.error('Enhanced search error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Search failed' 
    });
  }
});

// Admin dashboard statistics
app.get('/api/admin/stats', adminAuth, async (req, res) => {
  try {
    // Get total users
    const usersResult = await pool.query('SELECT COUNT(*) FROM users');
    const totalUsers = parseInt(usersResult.rows[0].count);

    // Get total listings
    const listingsResult = await pool.query('SELECT COUNT(*) FROM listings');
    const totalListings = parseInt(listingsResult.rows[0].count);

    // Get listings by status
    const statusResult = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM listings 
      GROUP BY status
    `);

    // Get recent users (last 7 days)
    const recentUsersResult = await pool.query(`
      SELECT COUNT(*) 
      FROM users 
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `);
    const recentUsers = parseInt(recentUsersResult.rows[0].count);

    // Get messages count
    const messagesResult = await pool.query('SELECT COUNT(*) FROM chats');
    const totalMessages = parseInt(messagesResult.rows[0].count);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalListings,
        recentUsers,
        totalMessages,
        byStatus: statusResult.rows
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch statistics' 
    });
  }
});

// Bulk operations for admin
app.post('/api/admin/listings/bulk-action', adminAuth, async (req, res) => {
  try {
    const { action, listingIds, status } = req.body;

    if (!['update_status', 'delete'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action'
      });
    }

    if (!Array.isArray(listingIds) || listingIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No listings selected'
      });
    }

    let query;
    let values;

    if (action === 'update_status' && status) {
      query = `
        UPDATE listings 
        SET status = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ANY($2)
        RETURNING id, title, status
      `;
      values = [status, listingIds];
    } else if (action === 'delete') {
      query = `
        DELETE FROM listings 
        WHERE id = ANY($1)
        RETURNING id, title
      `;
      values = [listingIds];
    }

    const result = await pool.query(query, values);

    res.json({
      success: true,
      message: `${result.rows.length} listings ${action === 'delete' ? 'deleted' : 'updated'} successfully`,
      affected: result.rows
    });
  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({
      success: false,
      error: 'Bulk operation failed'
    });
  }
});

// User profile enhancement
app.put('/api/users/profile', auth, async (req, res) => {
  try {
    const { name, phone, preferences } = req.body;
    
    // First, check if phone column exists, if not alter table
    try {
      await pool.query('SELECT phone FROM users LIMIT 1');
    } catch (e) {
      // Add phone column if it doesn't exist
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB');
    }

    const result = await pool.query(
      `UPDATE users 
       SET name = $1, phone = $2, preferences = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 
       RETURNING id, email, name, phone, preferences, created_at`,
      [name, phone, preferences, req.user.id]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Change password
app.put('/api/users/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long'
      });
    }

    // Get user with password
    const userResult = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = userResult.rows[0];

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await pool.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

// File management - get user's uploaded files
app.get('/api/users/files', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, image_url, created_at 
       FROM listings 
       WHERE user_id = $1 AND image_url IS NOT NULL 
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      files: result.rows
    });
  } catch (error) {
    console.error('Get user files error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch files'
    });
  }
});

// System health with detailed metrics
app.get('/api/admin/health', adminAuth, async (req, res) => {
  try {
    // Database health
    const dbResult = await pool.query('SELECT NOW() as time, version() as version');
    
    // System metrics
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    const listingsCount = await pool.query('SELECT COUNT(*) FROM listings');
    const messagesCount = await pool.query('SELECT COUNT(*) FROM chats');
    
    res.json({
      success: true,
      health: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          timestamp: dbResult.rows[0].time,
          version: dbResult.rows[0].version
        },
        metrics: {
          users: parseInt(usersCount.rows[0].count),
          listings: parseInt(listingsCount.rows[0].count),
          messages: parseInt(messagesCount.rows[0].count)
        },
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version
        }
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      health: {
        status: 'unhealthy',
        error: error.message
      }
    });
  }
});

// Export user data (GDPR compliance)
app.get('/api/users/export-data', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user data
    const userResult = await pool.query(
      'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    // Get user's listings
    const listingsResult = await pool.query(
      'SELECT * FROM listings WHERE user_id = $1',
      [userId]
    );

    // Get user's messages
    const messagesResult = await pool.query(
      'SELECT * FROM chats WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1000',
      [userId]
    );

    const exportData = {
      user: userResult.rows[0],
      listings: listingsResult.rows,
      messages: messagesResult.rows,
      exportedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export user data'
    });
  }
});

// WebSocket Connection Handling
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token) {
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
    await initialiseDatabase();
    
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

module.exports = { app, io };