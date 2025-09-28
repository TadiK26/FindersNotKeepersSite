/*
 * This code defines two middleware functions, auth and adminAuth, to handle user authentication and authorisation using JSON Web Tokens (JWT).
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // import user class

// Verify token and get user
const verifyTokenAndGetUser = async (token) => {
  if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' }); // not token found, return response with status 401 
    }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.userId);

  if (!user) {
      return res.status(401).json({ error: 'Token is invalid' }); // invalid token, return response with status 401
    }

  return user;
};

const auth = async (req, res, next) => { // verifies that the incoming HTTP request contains a valid JWT token and authenticates the user.
  try {
    const authHeader =  req.header('Authorization');
    const token = authHeader && authHeader.replace('Bearer ', ''); // read request header
    
    const user = await verifyTokenAndGetUser(token);

    //const decoded = jwt.verify(token, process.env.JWT_SECRET); // check if valid JWT token
    //const user = await User.findById(decoded.userId); // get user by ID

    req.user = user;
    next(); // proceeds after verifying token
  } catch (error) {
    res.status(401).json({ error: 'Token is invalid' });
  }
};

const adminAuth = async (req, res, next) => { // extended authentication to verify that a user has admin role
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.replace('Bearer', '');
    
    const user = await verifyTokenAndGetUser(token);

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' }); // unauthorised user, return repsonse with status 403
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' }); // failed authentification, return response with status 401
  }
};

module.exports = { auth, adminAuth };