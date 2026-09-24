const mongoose = require('mongoose');

// ----------------------------------------------------------------------
// DATABASE CONNECTION
// Establishes connection to MongoDB using Mongoose
// ----------------------------------------------------------------------
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edumerge_support');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
