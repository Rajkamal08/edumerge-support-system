const express = require('express');
const router = express.Router();
const { createTicket, getTickets, getTicketById, updateTicketStatus, assignTicket, addComment } = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/authMiddleware');

// ----------------------------------------------------------------------
// BASE TICKET ROUTES
// GET: Fetches tickets based on the user's role (Student/Staff/Manager)
// POST: Allows Students to create new tickets
// ----------------------------------------------------------------------
router.route('/')
    .post(protect, authorize('STUDENT'), createTicket)
    .get(protect, getTickets);

// ----------------------------------------------------------------------
// TICKET DETAIL & MANAGEMENT
// ----------------------------------------------------------------------
router.route('/:id')
    .get(protect, getTicketById);

// State transitions (e.g., OPEN -> IN_PROGRESS)
router.route('/:id/status')
    .patch(protect, authorize('STAFF', 'MANAGER'), updateTicketStatus);

// Claiming or reassigning a ticket to a staff member
router.route('/:id/assign')
    .patch(protect, authorize('STAFF', 'MANAGER'), assignTicket);

// ----------------------------------------------------------------------
    // TICKET ACTIVITY LOGS
    // Posts a new comment or internal note to the ticket's timeline
    // ----------------------------------------------------------------------
    router.route('/:id/activity')
        .post(protect, addComment);

module.exports = router;
