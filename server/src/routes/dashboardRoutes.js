const express = require('express');
const router = express.Router();
const { getDashboardMetrics } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

// ----------------------------------------------------------------------
// DASHBOARD ROUTES
// Restricted routes for operational analytics
// ----------------------------------------------------------------------
router.route('/')
    .get(protect, authorize('MANAGER', 'STAFF'), getDashboardMetrics);

module.exports = router;
