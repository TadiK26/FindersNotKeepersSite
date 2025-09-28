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
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [room_id, user_id, message, timestamp]
    );

    return result.rows[0];
  }

  // Get all messages for a specific chat room, ordered by creation time
  static async findByRoomId(roomId, limit = 50) {
    const result = await pool.query(
      `SELECT c.*, u.name as user_name 
       FROM chats c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.room_id = $1 
       ORDER BY c.created_at ASC 
       LIMIT $2`,
      [roomId, limit]
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
// Additional features: message editing, reactions, or typing indicators.