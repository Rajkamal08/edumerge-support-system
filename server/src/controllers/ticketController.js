const Ticket = require('../models/Ticket');
const Activity = require('../models/Activity');

// ----------------------------------------------------------------------
// SLA MAPPING
// Determines the baseline deadline hours depending on ticket priority
// ----------------------------------------------------------------------
const SLA_HOURS = {
    LOW: 72,
    MEDIUM: 48,
    HIGH: 24,
    URGENT: 8
};

// ----------------------------------------------------------------------
// 1. TICKET CREATION
// ----------------------------------------------------------------------

// @desc    Create a new ticket
// @route   POST /api/tickets
// @access  Private (Student)
const createTicket = async (req, res) => {
    const { category, department, subject, description, priority } = req.body;

    try {
        const slaDuration = (SLA_HOURS[priority] || 48) * 60 * 60 * 1000;
        
        // Generate a random ID like EDU-1042
        const ticketId = `EDU-${Math.floor(1000 + Math.random() * 9000)}`;

        const ticket = await Ticket.create({
            ticketId,
            studentId: req.user._id,
            department,
            category,
            subject,
            description,
            priority,
            status: 'OPEN',
            slaDeadline: new Date(Date.now() + slaDuration)
        });

        await Activity.create({
            ticketId: ticket._id,
            authorId: req.user._id,
            type: 'TICKET_CREATED',
            content: 'Ticket created by student',
            newState: 'OPEN'
        });

        res.status(201).json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// ----------------------------------------------------------------------
// 2. FETCHING TICKETS
// ----------------------------------------------------------------------
// @desc    Get all tickets (Filtered by Role)
// @route   GET /api/tickets
// @access  Private
const getTickets = async (req, res) => {
    try {
        let query = {};
        
        if (req.user.role === 'STUDENT') {
            query.studentId = req.user._id;
        } else if (req.user.role === 'STAFF') {
            // Staff can see assigned to them, or tickets in their department
            query = {
                $or: [
                    { assignedTo: req.user._id },
                    { department: req.user.department }
                ]
            };
        }
        // Manager sees all, so query remains {}

        const tickets = await Ticket.find(query)
            .populate('studentId', 'name email')
            .populate('assignedTo', 'name')
            .sort({ createdAt: -1 });

        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// ----------------------------------------------------------------------
// 3. GET SINGLE TICKET
// ----------------------------------------------------------------------
// @desc    Get ticket by ID
// @route   GET /api/tickets/:id
// @access  Private
const getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('studentId', 'name email')
            .populate('assignedTo', 'name email');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Fetch activities
        const activities = await Activity.find({ ticketId: ticket._id })
            .populate('authorId', 'name role')
            .sort({ createdAt: 1 });

        res.json({ ticket, activities });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// ----------------------------------------------------------------------
// 4. STATUS & SLA MANAGEMENT
// ----------------------------------------------------------------------
const STATUS_TRANSITIONS = {
    OPEN: ["ASSIGNED"],
    ASSIGNED: ["IN_PROGRESS"],
    IN_PROGRESS: ["PENDING_STUDENT", "RESOLVED"],
    PENDING_STUDENT: ["IN_PROGRESS"],
    RESOLVED: ["CLOSED", "REOPENED"],
    CLOSED: ["REOPENED"],
    REOPENED: ["IN_PROGRESS"]
};

// @desc    Update ticket status and handle SLA pauses
// @route   PATCH /api/tickets/:id/status
// @access  Private (Staff/Manager)
const updateTicketStatus = async (req, res) => {
    const { status } = req.body;
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        // Enforce state machine transitions
        if (!STATUS_TRANSITIONS[ticket.status].includes(status)) {
            return res.status(400).json({ message: `Invalid status transition from ${ticket.status} to ${status}` });
        }

        const previousState = ticket.status;
        
        // SLA Pause Logic for Pending Student
        if (status === 'PENDING_STUDENT') {
            ticket.slaPausedAt = new Date();
        } else if (previousState === 'PENDING_STUDENT' && status === 'IN_PROGRESS') {
            const pauseDuration = new Date() - new Date(ticket.slaPausedAt);
            ticket.totalPausedDuration += pauseDuration;
            ticket.slaPausedAt = null;
            // Extend SLA deadline by the paused duration
            ticket.slaDeadline = new Date(ticket.slaDeadline.getTime() + pauseDuration);
        }

        ticket.status = status;
        await ticket.save();

        // Log Activity
        await Activity.create({
            ticketId: ticket._id,
            authorId: req.user._id,
            type: 'STATUS_CHANGE',
            content: `Status changed to ${status}`,
            previousState,
            newState: status
        });

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// ----------------------------------------------------------------------
// 5. TICKET ASSIGNMENT
// ----------------------------------------------------------------------
// @desc    Assign ticket to a staff member
// @route   PATCH /api/tickets/:id/assign
// @access  Private (Staff/Manager)
const assignTicket = async (req, res) => {
    const { assignedTo } = req.body; // Can be user ID, or we can default to req.user._id if Staff claims it
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        const previousState = ticket.status;
        ticket.assignedTo = assignedTo || req.user._id;
        
        // Auto transition to ASSIGNED if OPEN
        if (ticket.status === 'OPEN') {
            ticket.status = 'ASSIGNED';
        }
        
        await ticket.save();

        await Activity.create({
            ticketId: ticket._id,
            authorId: req.user._id,
            type: 'ASSIGNMENT',
            content: `Ticket assigned`,
            previousState,
            newState: ticket.status,
            metadata: { newAssignee: ticket.assignedTo }
        });

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// ----------------------------------------------------------------------
// 6. TICKET ACTIVITY
// ----------------------------------------------------------------------
// @desc    Add comment or internal note to ticket timeline
// @route   POST /api/tickets/:id/activity
// @access  Private
const addComment = async (req, res) => {
    const { content, isInternal } = req.body;
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        const activity = await Activity.create({
            ticketId: ticket._id,
            authorId: req.user._id,
            type: isInternal ? 'NOTE' : 'COMMENT',
            content,
            isInternal: isInternal || false
        });

        res.status(201).json(activity);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = { createTicket, getTickets, getTicketById, updateTicketStatus, assignTicket, addComment };
