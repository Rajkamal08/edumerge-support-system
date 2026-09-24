const express = require('express');
const router = express.Router();
const { loginUser } = require('../controllers/authController');

// ----------------------------------------------------------------------
// AUTH ROUTES
// Public endpoints for logging in
// ----------------------------------------------------------------------
router.post('/login', loginUser);

module.exports = router;
