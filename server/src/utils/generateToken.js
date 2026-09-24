const jwt = require('jsonwebtoken');

// ----------------------------------------------------------------------
// JWT GENERATION
// Signs a secure JSON Web Token with the user's ID and Role
// ----------------------------------------------------------------------
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

module.exports = generateToken;
