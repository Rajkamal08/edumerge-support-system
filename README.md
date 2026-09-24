# Edumerge Pre-Drive Assignment: Student Support & Ticket Management

## 1. Project Overview
This repository contains a full-stack web application designed for educational institutions to manage student support requests effectively. It supports role-based access for Students, Support Staff, and Managers.

## 2. Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, React Router, Axios.
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT Auth.

## 3. Features & User Roles
- **Student**: Create tickets, track status, and communicate with staff.
- **Staff**: View departmental queues, claim unassigned tickets, update statuses, and log internal notes.
- **Manager**: Access an analytical dashboard showing total tickets, open tickets, SLA breaches, and workload metrics.

## 4. Running Locally
1. Start your local MongoDB server.
2. In the `server` directory, create a `.env` file with `MONGO_URI=mongodb://127.0.0.1:27017/edumerge_support` and `JWT_SECRET=supersecret_edumerge_key_2026`.
3. In the `server` directory, run the seeder: `node src/seed/seeder.js`
4. Start the backend: `npm run dev`
5. In the `client` directory, run `npm install` and then `npm run dev`
6. Access the app at `http://localhost:5173`.

## 5. Demo Credentials
The database seeder automatically creates these demo accounts:
- **Student**: `student@edumerge.demo` | Password: `password123`
- **Staff**: `staff@edumerge.demo` | Password: `password123`
- **Manager**: `manager@edumerge.demo` | Password: `password123`
