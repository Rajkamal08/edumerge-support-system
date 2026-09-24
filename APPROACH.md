# Product & Engineering Approach

## Why This Problem?
I selected the Student Support & Ticket Management assignment (Assignment 4) because it provides the best canvas to demonstrate end-to-end full-stack capabilities, deep product thinking (like SLA tracking), and complex state management (role-based access and strict status transitions).

## Product Decisions & Workflows
1. **The "Pending Student" SLA Pause**:
   - *Problem*: Traditional SLAs penalize support staff when they are waiting for a student to provide necessary documents (e.g., uploading a medical certificate).
   - *Solution*: When a ticket status transitions to `PENDING_STUDENT`, the SLA clock pauses (`slaPausedAt`). When it returns to `IN_PROGRESS`, the paused duration is calculated and added to the total deadline. This ensures the institution is only graded on their actual response time.

2. **Server-Enforced State Machine**:
   - Tickets cannot arbitrarily change status. The backend enforces a strict transition map (e.g., `CLOSED` cannot jump to `ASSIGNED` without going through `REOPENED` and `IN_PROGRESS`). This prevents dirty data and forces correct workflows.

3. **Separate Activity Collection**:
   - Instead of embedding comments inside a ticket document, a separate `Activity` collection is used. This allows for infinite scaling of a ticket's history, tracking not just comments but automated state changes and staff assignments.

## Database Design & Architecture
- **MongoDB** was chosen for its flexibility with documents, allowing us to store dynamic metadata in the Activity logs easily.
- **RESTful API** design ensures clear, decoupled communication between the React frontend and the Express backend.

## Assumptions
1. **Department Routing**: We assume tickets can be broadly categorized into fixed departments (e.g., IT, Accounts) and that Staff are siloed into these departments for processing.
2. **SLA Deadlines**: We assume that SLAs only apply to operational business hours, though for the sake of this prototype, they run on a continuous 24/7 clock.
3. **Manager Role**: We assume Managers do not claim or close tickets directly, but rather oversee the operational health of the queues via the analytics dashboard.

## Trade-offs
1. **Frontend SLA Calculation vs. Backend Cron Jobs**: 
   - *Trade-off*: We chose to calculate SLA breaches dynamically on the frontend (comparing `slaDeadline` to `Date.now()`) rather than running a heavy background cron job on the server to update statuses to "Breached". 
   - *Why*: This saves immense server resources and database writes for a prototype, at the minor cost of the database not having a strict `isBreached` boolean actively updated in real-time.
2. **REST API vs. WebSockets**: 
   - *Trade-off*: We used standard REST API polling (refreshing data on action) instead of WebSockets for live ticket updates. 
   - *Why*: WebSockets add significant infrastructure overhead. For a prototype support queue, instant real-time pushes are less critical than a stable, stateless REST architecture.

## Validation & Important Edge Cases
1. **SLA Breach Thresholds**: Handled via continuous time-diff checks on the frontend rather than expensive server-side cron jobs. The database strictly stores the `slaDeadline`, while the frontend dynamic evaluates if `Date.now() > slaDeadline`.
2. **Preventing Unauthorized Transitions**: The API completely blocks a Student from modifying their ticket status arbitrarily, ensuring they can't manually close and reopen tickets repeatedly to skew metrics. Only staff can change status, except for creating the ticket initially.
3. **Ghost Tickets (Unassigned)**: A dedicated `UNASSIGNED` filter is prioritized on the staff dashboard. Tickets can be easily claimed by a single click. We prevented race-conditions by ensuring the database explicitly sets `assignedTo: staffId` only if it aligns with their department/role.
4. **Data Overload via Comments**: Instead of an array of strings in a Ticket document (which could hit MongoDB's 16MB document limit), activities (comments + state changes) are stored in an independent `Activity` collection indexed by `ticketId`. This ensures O(1) document size scaling regardless of how long a ticket takes to resolve.
