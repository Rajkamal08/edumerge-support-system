const mongoose = require('mongoose');

// ----------------------------------------------------------------------
// ACTIVITY SCHEMA
// Used to log all comments, internal notes, and state changes for tickets.
// This allows infinite vertical scaling of a ticket's history.
// ----------------------------------------------------------------------
const activitySchema = new mongoose.Schema({
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['COMMENT', 'STATUS_CHANGE', 'ASSIGNMENT', 'NOTE', 'TICKET_CREATED'], required: true },
    content: { type: String, required: true },
    
    previousState: { type: String },
    newState: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
    
    isInternal: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
