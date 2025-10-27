/**
 * Admin routes for moderation and management
 * Requires admin authentication middleware
 */
const express = require('express');
const { pool } = require('../config/database');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// ===== LISTINGS MODERATION =====

// Get all pending listings
router.get('/listings', adminAuth, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;

    const result = await pool.query(
      `SELECT l.*, u.name as user_name, u.email as user_email
       FROM listings l
       JOIN users u ON l.user_id = u.id
       WHERE l.status = $1
       ORDER BY l.created_at DESC`,
      [status]
    );

    res.json({
      success: true,
      listings: result.rows
    });
  } catch (error) {
    console.error('Fetch pending listings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch listings'
    });
  }
});

// Approve listing
router.put('/listings/:id/approve', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE listings
       SET status = 'approved', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }

    res.json({
      success: true,
      message: 'Listing approved successfully',
      listing: result.rows[0]
    });
  } catch (error) {
    console.error('Approve listing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve listing'
    });
  }
});

// Deny listing
router.put('/listings/:id/deny', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE listings
       SET status = 'denied', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }

    res.json({
      success: true,
      message: 'Listing denied successfully',
      listing: result.rows[0]
    });
  } catch (error) {
    console.error('Deny listing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deny listing'
    });
  }
});

// ===== CLAIMS MODERATION =====

// Get all pending claims
router.get('/claims', adminAuth, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;

    // First check if status column exists in verifications table
    const result = await pool.query(
      `SELECT v.*,
              l.title as listing_title,
              u.name as claimant_name, u.email as claimant_email
       FROM verifications v
       JOIN listings l ON v.listing_id = l.id
       JOIN users u ON v.user_id = u.id
       WHERE v.status = $1
       ORDER BY v.created_at DESC`,
      [status]
    );

    res.json({
      success: true,
      claims: result.rows
    });
  } catch (error) {
    console.error('Fetch pending claims error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch claims'
    });
  }
});

// Approve claim
router.put('/claims/:id/approve', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Update claim status
    const claimResult = await pool.query(
      `UPDATE verifications
       SET status = 'approved'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (claimResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Claim not found'
      });
    }

    const claim = claimResult.rows[0];

    // Update listing status to claimed
    await pool.query(
      `UPDATE listings
       SET status = 'claimed', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [claim.listing_id]
    );

    res.json({
      success: true,
      message: 'Claim approved successfully',
      claim: claim
    });
  } catch (error) {
    console.error('Approve claim error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve claim'
    });
  }
});

// Deny claim
router.put('/claims/:id/deny', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE verifications
       SET status = 'denied'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Claim not found'
      });
    }

    res.json({
      success: true,
      message: 'Claim denied successfully',
      claim: result.rows[0]
    });
  } catch (error) {
    console.error('Deny claim error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deny claim'
    });
  }
});

// ===== AUDIT LOG REPORTS =====

// Get audit logs with filters
router.get('/audit-logs', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate, userId, action } = req.query;

    let query = `
      SELECT al.*, a.description as action_description, u.name as user_name, u.email as user_email
      FROM audit_logs al
      LEFT JOIN actions a ON al.action_id = a.id
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 0;

    if (startDate) {
      paramCount++;
      query += ` AND al.created_at >= $${paramCount}`;
      values.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND al.created_at <= $${paramCount}`;
      values.push(endDate + ' 23:59:59');
    }

    if (userId) {
      paramCount++;
      query += ` AND al.user_id = $${paramCount}`;
      values.push(userId);
    }

    if (action) {
      paramCount++;
      query += ` AND al.action_id = $${paramCount}`;
      values.push(action);
    }

    query += ' ORDER BY al.created_at DESC LIMIT 1000';

    const result = await pool.query(query, values);

    res.json({
      success: true,
      logs: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Fetch audit logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs'
    });
  }
});

// ===== USER MANAGEMENT =====

// Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, name, role, created_at, updated_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      users: result.rows
    });
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

// Ban user
router.put('/users/:id/ban', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is trying to ban themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot ban yourself'
      });
    }

    // Add banned column if it doesn't exist
    try {
      await pool.query('SELECT banned FROM users LIMIT 1');
    } catch (e) {
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT false');
    }

    const result = await pool.query(
      `UPDATE users
       SET banned = true, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, email, name, role, banned`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User banned successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to ban user'
    });
  }
});

// Unban user
router.put('/users/:id/unban', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE users
       SET banned = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, email, name, role, banned`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User unbanned successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unban user'
    });
  }
});

// ===== DASHBOARD STATISTICS =====

// Get admin dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const statsPromises = [
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM listings'),
      pool.query('SELECT COUNT(*) FROM listings WHERE status = $1', ['pending']),
      pool.query('SELECT COUNT(*) FROM verifications WHERE status = $1', ['pending']),
    ];

    const [usersCount, listingsCount, pendingListings, pendingClaims] = await Promise.all(statsPromises);

    res.json({
      success: true,
      stats: {
        totalUsers: parseInt(usersCount.rows[0].count),
        totalListings: parseInt(listingsCount.rows[0].count),
        pendingListings: parseInt(pendingListings.rows[0].count),
        pendingClaims: parseInt(pendingClaims.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Fetch stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;
