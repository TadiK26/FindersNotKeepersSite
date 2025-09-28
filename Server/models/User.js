/*
This code defines a User class that provides methods to interact with a PostgreSQL database's users table
It uses the pg connection pool (pool) to run SQL queries and bcryptjs to securely hash and compare passwords
 */
const { pool } = require('../config/database'); // The PostgreSQL connection is imported from database config
const bcrypt = require('bcryptjs'); // Hash passwords securely 


// Creaete user class
// A user has: data, email, id, password
class User {
  static async create(userData) { // get user details from userData
    const { email, password, name, role } = userData;
    const hashedPassword = await bcrypt.hash(password, 12); // hash password
    
    const result = await pool.query( // insert user into table
      `INSERT INTO users (email, password, name, role) 
       VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at`,
      [email, hashedPassword, name, role]
    );
    
    return result.rows[0];// returns the new user's id, email, name, role, and created_at timestamp
  }

  static async findByEmail(email) { // returns user record by email address 
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  static async findById(id) { // returns user record, excluding password, by id
    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async comparePassword(plainPassword, hashedPassword) { // compares plainttext password with hashed password
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;