const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ----------------------------------------------------------------------
// 1. PROTECT ROUTE MIDDLEWARE
// Verifies the incoming JWT token and attaches the user object to req
// ----------------------------------------------------------------------
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            req.user = await User.findById(decoded.id).select('-passwordHash');
            
            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }
            
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// ----------------------------------------------------------------------
// 2. ROLE AUTHORIZATION MIDDLEWARE
// Restricts access to specific roles (e.g. ['MANAGER', 'STAFF'])
// ----------------------------------------------------------------------
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'User role not authorized' });
        }
        next();
    };
};

module.exports = { protect, authorize };
