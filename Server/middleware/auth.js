/*
 * This code defines two middleware functions, auth and adminAuth, to handle user authentication and authorisation using JSON Web Tokens (JWT).
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // import user class

const auth = async (req, res, next) => { // verifies that the incoming HTTP request contains a valid JWT token and authenticates the user.
  try {
    const token = req.header('Authorization')?.replace('Bearer ', ''); // read request header
    
    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' }); // not token found, return response with status 401 
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET); // check if valid JWT token
    const user = await User.findById(decoded.userId); // get user by ID
    
    if (!user) {
      return res.status(401).json({ error: 'Token is invalid' }); // invalid token, return response with status 401
    }

    req.user = user;
    next(); // proceeds after verifying token
  } catch (error) {
    res.status(401).json({ error: 'Token is invalid' });
  }
};

const adminAuth = async (req, res, next) => { // extended authentication to verify that a user has admin role
  try {
    await auth(req, res, () => {});
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' }); // unauthorised user, return repsonse with status 403
    }
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' }); // failed authentification, return response with status 401
  }
};

module.exports = { auth, adminAuth };