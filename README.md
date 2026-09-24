# 🎓 Edumerge: Student Support & Ticket Management System

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

> **🚀 Live Prototype:** [https://edumerge-support-system.vercel.app](https://edumerge-support-system.vercel.app)

## 📖 Project Overview
This repository contains a full-stack, production-ready web application designed for educational institutions to manage student support requests. Built to handle complex real-world workflows, it features robust state management, deep role-based access control (Student, Staff, Manager), and dynamic Service Level Agreement (SLA) tracking.

---

## 🏗️ Architectural Highlights

To ensure data integrity and infinite scaling, this project implements three core architectural patterns:

1. **Strict Backend State Machine**
   - Tickets cannot arbitrarily change status. The API enforces a strict transition map (e.g., a `CLOSED` ticket cannot jump directly to `IN_PROGRESS` without first passing through `REOPENED`). This prevents dirty data and forces users to follow strict operational workflows.
2. **Dynamic SLA Pausing (`PENDING_STUDENT`)**
   - Traditional support SLAs unfairly penalize staff when they are waiting for a user to reply. When a ticket enters the `PENDING_STUDENT` state, the backend automatically calculates the `slaPausedAt` timestamp. When the student replies, the SLA countdown accurately resumes, ensuring institutional metrics are mathematically flawless.
3. **Decoupled Activity Timelines**
   - Instead of cramming comment strings into an array inside a Ticket document (which risks hitting MongoDB's 16MB limit), all actions are pushed to an independent `Activity` collection. This allows for an infinite, infinitely scalable timeline of system logs, public comments, and internal staff notes.

---

## 👥 Features & User Roles

- **🧑‍🎓 Student**: 
  - Create tickets categorized by department (Fees, ID Cards, etc).
  - Track real-time status updates and communicate directly with assigned staff.
- **🧑‍💼 Staff**: 
  - Access a focused operational dashboard featuring unassigned departmental queues.
  - 1-click claim workflows to take ownership of tickets.
  - Update ticket statuses and leave private internal notes invisible to students.
- **📊 Manager**: 
  - Access a high-level analytical dashboard.
  - Monitor aggregate SLA health across the institution (🔴 Breached, 🟡 At Risk, 🟢 On Track).
  - Review workload distributions and departmental bottlenecks.

---

## 💻 Tech Stack
- **Frontend**: React (Vite), Tailwind CSS (Glassmorphism UI), React Router, Axios.
- **Backend**: Node.js, Express, MongoDB (Mongoose).
- **Security**: JWT-based Authentication, Role-Based Route Protection, Server-side State Enforcement.

---

## 🚀 Running Locally

1. Start your local MongoDB server (or use a MongoDB Atlas URI).
2. In the `server` directory, create a `.env` file with:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/edumerge_support
   JWT_SECRET=supersecret_edumerge_key_2026
   ```
3. In the `server` directory, run the seeder to populate the demo data:
   ```bash
   node src/seed/seeder.js
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```
5. In the `client` directory, install dependencies and start the Vite dev server:
   ```bash
   npm install
   npm run dev
   ```
6. Access the application locally at `http://localhost:5173`.

---

## 🔑 Demo Credentials

The database seeder automatically generates the following accounts for testing the three unique role layouts:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Student** | `student@edumerge.demo` | `password123` |
| **Staff** | `staff@edumerge.demo` | `password123` |
| **Manager** | `manager@edumerge.demo` | `password123` |
