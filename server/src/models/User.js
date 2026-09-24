const mongoose = require('mongoose');

// ----------------------------------------------------------------------
// USER SCHEMA
// Defines the core user entity including their role for RBAC
// ----------------------------------------------------------------------
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['STUDENT', 'STAFF', 'MANAGER'], required: true },
    department: { type: String, enum: ['ACADEMICS', 'ACCOUNTS', 'ADMINISTRATION', 'EXAMINATION', 'IT'] }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
