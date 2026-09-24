const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// ----------------------------------------------------------------------
// 1. INITIALIZATION & DATABASE
// ----------------------------------------------------------------------
dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// ----------------------------------------------------------------------
// 2. MIDDLEWARE
// ----------------------------------------------------------------------
app.use(cors());
app.use(express.json());

// ----------------------------------------------------------------------
// 3. UTILITY ROUTES
// ----------------------------------------------------------------------

// Health Check Route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Edumerge Support API is running' });
});

// Get Staff Users (For ticket reassignment dropdowns)
app.get('/api/staff', async (req, res) => {
    try {
        const User = require('./models/User');
        const staff = await User.find({ role: 'STAFF' }).select('_id name');
        res.json(staff);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------------------------
// 4. CORE API ROUTES
// ----------------------------------------------------------------------
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
