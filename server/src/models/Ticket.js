const mongoose = require('mongoose');

// ----------------------------------------------------------------------
// TICKET SCHEMA
// The central entity of the application. Tracks the current state, 
// assignment, and SLA deadlines for a support request.
// ----------------------------------------------------------------------
const ticketSchema = new mongoose.Schema({
    ticketId: { type: String, required: true, unique: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    department: { type: String, enum: ['ACADEMICS', 'ACCOUNTS', 'ADMINISTRATION', 'EXAMINATION', 'IT'], required: true },
    category: { type: String, enum: ['FEES', 'ATTENDANCE', 'ID_CARD', 'CERTIFICATE', 'DOCUMENTS', 'OTHER'], required: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], required: true },
    status: { type: String, enum: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_STUDENT', 'RESOLVED', 'CLOSED', 'REOPENED'], default: 'OPEN' },
    
    // SLA Tracking
    slaDeadline: { type: Date, required: true },
    slaPausedAt: { type: Date, default: null },
    totalPausedDuration: { type: Number, default: 0 },
    slaBreached: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);
