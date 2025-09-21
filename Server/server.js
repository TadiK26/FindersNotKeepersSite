const app = require('./src/app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/findersnotkeepers';

mongoose.connect(MONGODB_URI).then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
        console.log('Server API is running on port ${PORT}');
    });
})
.catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1); // exits process if DB connection fails
});
