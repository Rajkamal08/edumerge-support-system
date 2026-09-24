const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const Activity = require('../models/Activity');

dotenv.config({ path: '../.env' }); // Adjust depending on run dir

// ----------------------------------------------------------------------
// DATABASE CONNECTION
// ----------------------------------------------------------------------
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edumerge_support');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

// ----------------------------------------------------------------------
// DATA IMPORT ROUTINE
// Drops the existing database collections and provisions fresh demo data
// ----------------------------------------------------------------------
const importData = async () => {
    await connectDB();
    try {
        await User.deleteMany();
        await Ticket.deleteMany();
        await Activity.deleteMany();

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('password123', salt);

        // ----------------------------------------------------------------------
        // 1. SEED USERS (One for each persona)
        // ----------------------------------------------------------------------
        const users = await User.insertMany([
            { name: 'John Doe', email: 'student@edumerge.demo', passwordHash, role: 'STUDENT', department: 'IT' },
            { name: 'Sarah Staff', email: 'staff@edumerge.demo', passwordHash, role: 'STAFF', department: 'ACADEMICS' },
            { name: 'Mike Manager', email: 'manager@edumerge.demo', passwordHash, role: 'MANAGER', department: 'ADMINISTRATION' }
        ]);

        const student = users[0]._id;
        const staff = users[1]._id;

        // ----------------------------------------------------------------------
        // 2. SEED TICKETS (Initial demo state)
        // ----------------------------------------------------------------------
        const ticket = await Ticket.create({
            ticketId: 'EDU-1001',
            studentId: student,
            department: 'ACADEMICS',
            category: 'DOCUMENTS',
            subject: 'Missing Semester 4 Marksheet',
            description: 'Please issue my semester 4 marksheet as soon as possible, I need it for an internship application.',
            priority: 'HIGH',
            status: 'OPEN',
            slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
        });

        // ----------------------------------------------------------------------
        // 3. SEED ACTIVITY TIMELINES
        // ----------------------------------------------------------------------
        await Activity.create({
            ticketId: ticket._id,
            authorId: student,
            type: 'TICKET_CREATED',
            content: 'Ticket created',
            newState: 'OPEN'
        });

        console.log('Seed Data Imported Successfully!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

importData();
