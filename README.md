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

#### Design Choices & Implementation Approach
- **Workflow separation**: Each advanced feature is modular, with clear separation of concerns (e.g., payment approval, attendance, forum, calendar export).
- **Socket.IO**: Used for all real-time features (forum, notifications).
- **Role-based access**: Ensures only authorized users can perform sensitive actions (e.g., approve payments, reset passwords).
- **Auditability**: All critical actions (attendance, payment, password reset) are logged for traceability.
- **User experience**: Features like fuzzy search, calendar export, and real-time updates are prioritized for usability.

#### Technical Decisions
- **React** for rapid UI development and maintainability.
- **Express/Mongoose** for robust, scalable backend.
- **Socket.IO** for real-time features.
- **Cloudinary** for reliable media storage.
- **Levenshtein-based fuzzy search** for efficient, client-side typo tolerance.

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