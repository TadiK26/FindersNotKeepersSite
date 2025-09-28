/**This code makes a router that handles user registration, login, and fetching the current authenticated user. 
 * It uses JWT for authentication, express-validator for input validation, and the User model for database operations.
 */
const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Registration
// need a name, email and password to create an account
router.post('/register', [ // method: POST
  body('email').isEmail().normalizeEmail(), // email must be valid
  body('password').isLength({ min: 8 }), // password length min 8 chars
  body('name').notEmpty().trim() // name must not be empty
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() }); // if errors found return response with status 400
    }

    const { email, password, name, role = 'user' } = req.body;

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' }); // user exists, return response with status 400
    }

    // Create user
    const user = await User.create({ email, password, name, role });

    // Generate JWT
    const token = jwt.sign(// JWT token valid for 24 hours with the user's ID.
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } 
    );

    res.status(201).json({ // user created, reponse with status 201
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error occured during registration' });// failed to register, response with status 500
  }
});

// Login
// login with email and password
router.post('/login', [
  body('email').isEmail().normalizeEmail(), // must be valid email
  body('password').exists() // password must exist
], async (req, res) => {
  try {
    const errors = validationResult(req); // validate input
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() }); // invalid credentials, return response with status 400
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({// successfully logged in
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' }); // login failed, response with status 500
  }
});

// Get current user
router.get('/me', auth, async (req, res) => { // use the auth method to verify JWT token
  res.json({ user: req.user });
});

module.exports = router;