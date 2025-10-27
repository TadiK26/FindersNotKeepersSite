/**
 * This code makes a router that handles HTTP endpoints for listings.
 * It supports creating listings, getting listings with filters, fetching individual listings, getting a user's listings, and updating listing status (admin only).
 * It integrates authentication, authorisation, validation, and file upload middleware.
 */
const express = require('express');
const { body, validationResult } = require('express-validator');
const Listing = require('../models/Listing');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Create listing
router.post('/', auth, upload.single('image'), [
  body('title').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('category').notEmpty().trim(),
  body('item_type').isIn(['lost', 'found']),
  body('location').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const listingData = {
      user_id: req.user.id,
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      item_type: req.body.item_type,
      location: req.body.location,
      date_lost_found: req.body.date_lost_found || new Date(),
      image_url: req.file ? `/uploads/${req.file.filename}` : null
    };

    const listing = await Listing.create(listingData);
    res.status(201).json({ message: 'Listing created successfully', listing }); // response with status 201
  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({ error: 'Server error occured while trying to create a listing' });
  }
});

// Get all listings with optional filters
router.get('/', async (req, res) => {
  try {
    const filters = {};
    if (req.query.category) filters.category = req.query.category; // filter by category
    if (req.query.item_type) filters.item_type = req.query.item_type; // filter by item type
    if (req.query.status) filters.status = req.query.status; // filter by status

    const listings = await Listing.findAll(filters);
    res.json({ listings }); // response with filtered listings
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({ error: 'Server error occured while trying to fetch listings' }); // response with status 500
  }
});

// Get listing by ID
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    res.json({ listing }); // response with a listing
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({ error: 'Server error occurred while trying to fetch listing' }); // response with status 500
  }
});

// Get user's listings
router.get('/user/my-listings', auth, async (req, res) => {
  try {
    const listings = await Listing.findByUserId(req.user.id);
    res.json({ listings }); // response with user's listings
  } catch (error) {
    console.error('Get user listings error:', error);
    res.status(500).json({ error: 'Server error occurred while trying to fetch user listings' });
  }
});

// Update listing status (admin only)
router.patch('/:id/status', adminAuth, [
  body('status').isIn(['pending', 'approved', 'rejected', 'returned'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const listing = await Listing.updateStatus(req.params.id, req.body.status);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' }); // return reponse with error 404
    }

    res.json({ message: 'Listing status updated successfully', listing }); // response with successful message
  } catch (error) {
    console.error('Update listing status error:', error);
    res.status(500).json({ error: 'Server error occurred while trying to update listing status' }); // response with status 500
  }
});

module.exports = router;