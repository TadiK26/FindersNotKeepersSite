/*
This sets up a connection to our PostgreSQL database using the pg library's connection pool 'Pool'.
It loads environment variables for config, and initialises database tables if they don't already exist.
 */
const { Pool } = require('pg');
require('dotenv').config(); // Loads environment variables from a .env file into process.env, making it easy to configure sensitive information like database credentials.

// Create the connection pool
const pool = new Pool({// pool of connections to our PostgreSQL database using credentials from environment variables
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Test database connection
pool.on('connect', () => { // Logs a message when a connection to the database is established.
  console.log('Successfully connected to PostgreSQL database');
});

pool.on('error', (err) => { // logs any errors that occur with the database connection pool.
  console.error('Database connection error:', err); 
});

// Initialise database tables
// Creates four tables (users, listings, emails, verifications) if they do not already exist. 
// Database schema is set up before the application starts using it.
const initialiseDatabase = async () => {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Listings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS listings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        item_type VARCHAR(50) NOT NULL, -- 'lost' or 'found'
        location VARCHAR(255),
        date_lost_found TIMESTAMP,
        status VARCHAR(50) DEFAULT 'pending',
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Verification requests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        listing_id INTEGER REFERENCES listings(id),
        proof_description TEXT,
        image_url VARCHAR(500),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Chats table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chats (
        id SERIAL PRIMARY KEY,
        room_id VARCHAR(255) NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // User preferences table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        email_notifications BOOLEAN DEFAULT true,
        push_notifications BOOLEAN DEFAULT true,
        language VARCHAR(10) DEFAULT 'en',
        theme VARCHAR(20) DEFAULT 'light',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        related_entity_type VARCHAR(50),
        related_entity_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User sessions table for enhanced security
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        ip_address INET,
        user_agent TEXT,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Search history table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS search_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        query TEXT NOT NULL,
        filters JSONB,
        result_count INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
    `);
    // Add index for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_chats_room_id ON chats(room_id);
      CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats(created_at);
    `);
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};
//Each table uses appropriate data types and constraints (e.g., foreign keys, unique constraints, default values).
module.exports = {
  pool,
  initialiseDatabase
};