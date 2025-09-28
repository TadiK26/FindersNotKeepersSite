const express = require('express');
const User = require('../models/User'); // my user model
const { auth } = require('../middleware/auth'); // user auth plus attached user info on the request

const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id); // fetch full user record
    res.json({ user }); // send user data as JSON response
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' }); // any error, response with status 500
  }
});

module.exports = router;