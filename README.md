# Event Management System

## Libraries, Frameworks, and Modules

### Frontend
- **React**: Main UI framework for building interactive, component-based user interfaces.
- **react-router-dom**: Routing and navigation between pages.
- **axios**: HTTP client for API requests.
- **socket.io-client**: Real-time communication for discussion forums and notifications.
- **react-webcam**: QR code scanning for attendance and registration.
- **jsqr**: QR code decoding in browser.
- **@testing-library/react, jest-dom, user-event, dom**: Testing utilities for React components.

### Backend
- **Express**: Web server framework for REST APIs.
- **Mongoose**: MongoDB object modeling and schema validation.
- **jsonwebtoken**: Authentication and authorization using JWT.
- **bcrypt**: Password hashing for secure authentication.
- **nodemailer**: Sending emails for notifications and password resets.
- **cloudinary, multer, multer-storage-cloudinary**: File uploads and cloud storage for images and payment proofs.
- **dotenv**: Environment variable management.
- **cors**: Cross-origin resource sharing for frontend-backend communication.
- **axios**: Server-side HTTP requests (e.g., webhook integrations).
- **qrcode**: QR code generation for event tickets and attendance.
- **socket.io**: Real-time server for discussion forums and notifications.
- **json2csv**: CSV export for registrations and analytics.

## Advanced Features (Tier A, B, C)

### Tier A (Selected)
- **Merchandise Payment Approval Workflow**: Implements a payment verification system for merchandise purchases. Users upload payment proof after placing an order, which organizers must approve. Orders are only successful after approval, with QR ticket generation and stock management. Justification: Ensures secure, auditable merchandise sales and prevents fraud.
- **QR Scanner & Attendance Tracking**: Built-in QR code scanner for organizers to validate tickets and track attendance. Features include live dashboard, duplicate scan prevention, CSV export, and manual override with audit logging. Justification: Streamlines event check-in and ensures accurate attendance records.

### Tier B (Selected)
- **Real-Time Discussion Forum**: Socket-based forum on Event Details page, supporting message threading, reactions, organizer moderation (delete/pin/announce), and instant updates. Justification: Enhances participant engagement and organizer communication.
- **Organizer Password Reset Workflow**: Complete workflow for organizers to request password resets, with admin approval, status tracking, and secure password delivery. Justification: Provides robust, auditable password management for organizers.

### Tier C (Selected)
- **Add to Calendar Integration**: Participants can export registered events to external calendar applications (.ics download, Google Calendar, Outlook integration), with reminders and timezone support. Batch export supported. Justification: Improves event participation and user convenience.

## Advanced Features: Detailed Overview

### Tier A (Selected)

#### 1. Merchandise Payment Approval Workflow
**Justification:**
- Prevents fraudulent orders and ensures only paid merchandise is fulfilled.
- Gives organizers full control over merchandise distribution and stock.
- Provides participants with a clear, auditable payment process.

**Design & Implementation:**
- After placing a merchandise order, participants must upload payment proof (image).
- Orders enter a "Pending Approval" state; organizers see all pending orders in a dedicated dashboard tab.
- Organizers can view payment proofs, approve or reject payments, and add comments.
- On approval: order is marked successful, stock decremented, QR ticket generated, and confirmation email sent.
- No QR is generated for pending/rejected orders, ensuring only valid payments are processed.
- All actions are logged for auditability.

**Technical Decisions:**
- Used Cloudinary for secure image storage.
- Multer for file uploads, Socket.IO for real-time status updates.
- Role-based access ensures only organizers can approve/reject payments.

#### 2. QR Scanner & Attendance Tracking
**Justification:**
- Streamlines event check-in, reduces manual errors, and prevents ticket fraud.
- Enables real-time attendance monitoring and reporting.

**Design & Implementation:**
- Organizers use a built-in QR scanner (webcam or file upload) to validate tickets.
- Each scan marks attendance with a timestamp; duplicate scans are rejected.
- Live dashboard shows scanned vs. not-yet-scanned participants.
- Attendance data can be exported as CSV for reporting.
- Manual override option allows organizers to mark attendance in exceptional cases, with audit logging for transparency.

**Technical Decisions:**
- Used jsqr and react-webcam for in-browser QR scanning.
- Attendance logic and audit logs handled in backend (Express/Mongoose).
- Real-time updates via Socket.IO for live dashboards.

### Tier B (Selected)

#### 1. Real-Time Discussion Forum
**Justification:**
- Fosters participant engagement and instant support during events.
- Enables organizers to make announcements and moderate discussions.

**Design & Implementation:**
- Socket.IO-based forum on each Event Details page.
- Registered participants and organizers can post messages, reply (threaded), and react with emojis.
- Organizers can pin/delete messages and post announcements.
- Real-time notifications for new messages; UI updates instantly for all users.
- All forum actions are permission-checked and auditable.

**Technical Decisions:**
- Socket.IO for real-time messaging.
- Threading and reactions managed in MongoDB with efficient queries.
- Modular React component for easy reuse and extension.

#### 2. Organizer Password Reset Workflow
**Justification:**
- Ensures secure, auditable password resets for organizers.
- Prevents unauthorized access and tracks all reset requests.

**Design & Implementation:**
- Organizers request password reset from Admin via a dedicated UI.
- Admin dashboard lists all requests with club name, date, and reason.
- Admin can approve/reject with comments; on approval, a new password is generated and sent securely.
- Request status and history are tracked for transparency.

**Technical Decisions:**
- Nodemailer for secure email delivery.
- All requests and actions logged in MongoDB.
- Role-based access for sensitive actions.

### Tier C (Selected)

#### Add to Calendar Integration
**Justification:**
- Increases event participation by making it easy for users to add events to their personal calendars.
- Supports universal calendar formats and direct integration with Google/Outlook.

**Design & Implementation:**
- Participants can export individual or multiple events as .ics files (universal import).
- Direct integration links for Google Calendar and Microsoft Outlook.
- Users can set reminders and all times are timezone-aware.
- Batch export supported for convenience.

**Technical Decisions:**
- Custom ICS file generation in backend.
- Google/Outlook links generated server-side for accuracy.
- React components for seamless UI/UX.

## Setup & Installation

1. **Clone the repository:**
   ```sh
   git clone <repo-url>
   cd Event-Management-System
   ```
2. **Install dependencies:**
   ```sh
   cd backend && npm install
   cd ../frontend && npm install
   ```
3. **Configure environment variables:**
   - Copy `.env.example` to `.env` in both `backend` and `frontend` (if present) and fill in required values (MongoDB URI, JWT secret, Cloudinary, etc).
4. **Start the backend server:**
   ```sh
   cd backend
   npm run dev
   ```
5. **Start the frontend app:**
   ```sh
   cd ../frontend
   npm start
   ```
6. **Access the app:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:5000](http://localhost:5000)

---

For more details on features, usage, and API endpoints, see the code and comments in each module.