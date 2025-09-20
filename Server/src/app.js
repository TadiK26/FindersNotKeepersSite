const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

//Imported routes
const authRoutes = require('./routes/auth'); // route for authentication
const listingRoutes = require('./routes/listings'); // route for listings

const app = express();

//Middleware stuff
app.use(bodyParser.json({limit: '10mb'}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

//Routes in use
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);

//Test routes
app.get('/api/status', (req, res) => {
    res.json({message: 'Server API is active.'});
});

//Error handling for middleware
app.use(9=(error, req, res, next) => {
    console.error(error);
    res.status(500).json({message: 'An unexpected server error occured.'});
});
module.exports = app; // app is exported for use in server.js and testing
