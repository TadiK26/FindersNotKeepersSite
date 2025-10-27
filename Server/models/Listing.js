/*
This code makes the Listing class that creates interactions with the listings table in a PostgreSQL database. 
It uses the pool object from the database config to run SQL queries
*/
const { pool } = require('../config/database');

// Create listing class
// A listing has: user ID, title, description, category, item type, location, date lost & found, image URL
class Listing {
  static async create(listingData) {
    const user_id = listingData.user_id;
    const title = listingData.title;
    const description = listingData.description;
    const category = listingData.category;
    const item_type = listingData.item_type;
    const location = listingData.location;
    const date_lost_found = listingData.date_lost_found;
    const image_url = listingData.image_url;
    
    const result = await pool.query( // create new listing into the listings table
      `INSERT INTO listings (user_id, title, description, category, item_type, location, date_lost_found, image_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`, // uses parameterized queries (\$1, \$2, etc.) to prevent SQL injection
      [user_id, title, description, category, item_type, location, date_lost_found, image_url]
    );
    
    return result.rows[0];
  }

  static async findAll(filters = {}) { // gets all listings, (can also filter by category) item type ('lost' or 'found'), and status (e.g. pending)
    //Starts with a base query that joins listings with users to get the listing owner's name
    let query = 'SELECT l.*, u.name as user_name FROM listings l JOIN users u ON l.user_id = u.id WHERE 1=1';
    const values = [];
    let paramCount = 0;

    if (filters.category) {
      paramCount++;
      query += ` AND l.category = $${paramCount}`;
      values.push(filters.category);
    }

    if (filters.item_type) {
      paramCount++;
      query += ` AND l.item_type = $${paramCount}`;
      values.push(filters.item_type);
    }

    if (filters.status) {
      paramCount++;
      query += ` AND l.status = $${paramCount}`;
      values.push(filters.status);
    }

    query += ' ORDER BY l.created_at DESC';

    const result = await pool.query(query, values);
    return result.rows; // returns an array of listing records matching the filters.
  }

  static async findById(id) { // gets a single listing by its unique ID
    const result = await pool.query(
      `SELECT l.*, u.name as user_name, u.email as user_email 
       FROM listings l JOIN users u ON l.user_id = u.id 
       WHERE l.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async updateStatus(id, status) { // updates the status field of a listing (e.g. 'pending' to 'resolved' ).
    const result = await pool.query(
      'UPDATE listings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id] // also updates the updated_at timestamp to the current time
    );
    return result.rows[0]; // returns updated listings record
  }

  static async findByUserId(userId) { // get all listings created by a specific user
    const result = await pool.query(
      'SELECT * FROM listings WHERE user_id = $1 ORDER BY created_at DESC',
      [userId] // ordera results by creation date (descending)
    );
    return result.rows; // returns an array of listings
  }
}

module.exports = Listing;