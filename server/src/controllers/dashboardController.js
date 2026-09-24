const Ticket = require('../models/Ticket');
const User = require('../models/User');

// @desc    Get dashboard metrics
// @route   GET /api/dashboard
// @access  Private (Manager/Staff)
const getDashboardMetrics = async (req, res) => {
    try {
        const totalTickets = await Ticket.countDocuments();
        const openTickets = await Ticket.countDocuments({ status: 'OPEN' });
        const resolvedTickets = await Ticket.countDocuments({ status: { $in: ['RESOLVED', 'CLOSED'] } });
        
        const now = new Date();
        const activeStatuses = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_STUDENT'];
        
        // ----------------------------------------------------------------------
        // 1. SLA METRICS
        // Calculate SLA health only on active tickets that have a deadline
        // ----------------------------------------------------------------------
        const activeTickets = await Ticket.find({ status: { $in: activeStatuses } }).populate('assignedTo', 'name');
        
        let slaBreached = 0;
        let slaAtRisk = 0;
        let slaOnTrack = 0;
        const slaAttentionTickets = [];

        activeTickets.forEach(t => {
            if (!t.slaDeadline) return;
            
            const diffHours = (new Date(t.slaDeadline) - now) / (1000 * 60 * 60);
            
            if (diffHours < 0) {
                slaBreached++;
                slaAttentionTickets.push(t);
            } else if (diffHours < 4) {
                slaAtRisk++;
                slaAttentionTickets.push(t);
            } else {
                slaOnTrack++;
            }
        });

        // ----------------------------------------------------------------------
        // 2. CATEGORY & STATUS AGGREGATIONS
        // Group tickets for dashboard charts
        // ----------------------------------------------------------------------
        const ticketsByCategory = await Ticket.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const ticketsByStatus = await Ticket.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        // ----------------------------------------------------------------------
        // 3. STAFF WORKLOAD
        // Calculate total assigned, active, and resolved tickets per staff member
        // ----------------------------------------------------------------------
        const staffWorkloadRaw = await Ticket.aggregate([
            { $match: { assignedTo: { $ne: null } } },
            { 
                $group: { 
                    _id: "$assignedTo", 
                    totalAssigned: { $sum: 1 },
                    active: { 
                        $sum: { 
                            $cond: [{ $in: ["$status", activeStatuses] }, 1, 0] 
                        } 
                    },
                    resolved: { 
                        $sum: { 
                            $cond: [{ $in: ["$status", ["RESOLVED", "CLOSED"]] }, 1, 0] 
                        } 
                    }
                } 
            }
        ]);

        // Populate staff names since the aggregate only returns object IDs
        const staffWorkload = await User.populate(staffWorkloadRaw, { path: '_id', select: 'name' });

        // ----------------------------------------------------------------------
        // 4. FINAL RESPONSE
        // Return structured data to the frontend
        // ----------------------------------------------------------------------

        res.json({
            totalTickets,
            openTickets,
            resolvedTickets,
            slaBreached,
            slaAtRisk,
            slaOnTrack,
            slaAttentionTickets: slaAttentionTickets.sort((a, b) => new Date(a.slaDeadline) - new Date(b.slaDeadline)).slice(0, 10),
            ticketsByCategory,
            ticketsByStatus,
            staffWorkload: staffWorkload.map(sw => ({
                staffId: sw._id._id,
                name: sw._id.name,
                totalAssigned: sw.totalAssigned,
                active: sw.active,
                resolved: sw.resolved
            }))
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = { getDashboardMetrics };
