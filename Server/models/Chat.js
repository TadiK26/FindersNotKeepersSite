/* 
This code creates the chat class for two-way messaging on the web app
*/
const { pool } = require('../config/database');

// Create the chat class
// A chat has: room ID, user ID, message, created at
class Chat {
  // Create a new chat message
  static async create(messageData) { // inserts a new chat message
    const room_id = messageData.room_id; // ID of chatroom or convo
    const user_id = messageData.user_id; // who sent the message (foreign key to users)
    const message = messageData.message; // actual chat message
    const created_at = messageData.created_at; // when the message was sent

    // Use current timestamp if created_at not provided
    const timestamp = created_at || new Date();

    const result = await pool.query(
      `INSERT INTO chats (room_id, user_id, message, created_at) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, room_id, user_id, message, created_at`,
      [room_id, user_id, message, timestamp]
    );

    return result.rows[0];
  }

  // Get all messages for a specific chat room with user info, ordered by creation time
  static async findByRoomId(roomId, limit = 50) {
    const result = await pool.query(
      `SELECT c.*, u.name as user_name, u.email as user_email
       FROM chats c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.room_id = $1 
       ORDER BY c.created_at ASC 
       LIMIT $2`,
      [roomId, limit]
    );

    return result.rows;
  }
  // Get recent chat rooms for a user
  static async findUserRooms(userId, limit = 20) {
    const result = await pool.query(
      `SELECT DISTINCT room_id, MAX(created_at) as last_message_time
       FROM chats 
       WHERE user_id = $1 
       GROUP BY room_id 
       ORDER BY last_message_time DESC 
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  // Get recent messages sent by a specific user
  static async findByUserId(userId, limit = 50) { 
    const result = await pool.query(
      `SELECT * FROM chats 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  // Delete a message by ID (e.g., for moderation)
  static async deleteMessage(messageId) {
    const result = await pool.query(
      `DELETE FROM chats WHERE id = $1 RETURNING *`,
      [messageId]
    );

    return result.rows[0];
  }

  // Get unread message count for a user in specific rooms
  static async getUnreadCount(userId, roomId, lastSeen) {
    const result = await pool.query(
      `SELECT COUNT(*) as unread_count
       FROM chats 
       WHERE room_id = $1 AND user_id != $2 AND created_at > $3`,
      [roomId, userId, lastSeen]
    );

    return parseInt(result.rows[0].unread_count);
  }
}

module.exports = Chat;
//I will need to create a Chat table in 
// CREATE TABLE IF NOT EXISTS chats (
//   id SERIAL PRIMARY KEY,
//   room_id INTEGER NOT NULL,
//   user_id INTEGER REFERENCES users(id),
//   message TEXT NOT NULL,
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );

// Future:
// real-time chat functionality: combine this code with WebSocket on the server side to push new messages to clients instantly.
