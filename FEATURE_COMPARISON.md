# Feature Comparison Analysis

## Overview
Analysis of three features for Event Management System implementation. You need to choose 2 out of 3.

---

## Feature 1: Hackathon Team Registration

### 📊 CV Value: ⭐⭐⭐⭐⭐ (9/10)
**Why it's impressive:**
- Demonstrates **complex state management** (team formation, invites, acceptance flow)
- Shows **real-time collaboration** features (invite system, team synchronization)
- Involves **unique code generation** and **link sharing** mechanisms
- Showcases **transactional logic** (registration only completes when team is full)
- Highlights **event-driven architecture** (notifications, status updates)
- **Industry-relevant**: Team management is a common requirement in modern apps

**Resume Talking Points:**
- "Implemented end-to-end team registration workflow with invite system"
- "Built real-time team formation tracker with automatic status updates"
- "Designed unique code generation system for secure team invitations"
- "Orchestrated transactional registration logic ensuring data consistency"

---

### 💻 Code Complexity: **MODERATE-HIGH**

**New Files Required (Backend):**
1. `models/Team.js` - New model (~80 lines)
2. `models/TeamInvite.js` - New model (~60 lines)
3. `controllers/team.controller.js` - Full CRUD (~350 lines)
4. `routes/team.routes.js` - API routes (~40 lines)
5. Updates to `models/Registration.js` - Add team reference (~10 lines)
6. Updates to `models/Event.js` - Add team config fields (~20 lines)
7. Updates to `utils/emailService.js` - Team invite emails (~80 lines)
8. Updates to `controllers/registration.controller.js` - Team registration logic (~100 lines)

**New Files Required (Frontend):**
1. `pages/TeamRegistration.jsx` - Team creation/join UI (~400 lines)
2. `pages/TeamDashboard.jsx` - Team management interface (~300 lines)
3. `pages/TeamInvites.jsx` - Accept/reject invites (~200 lines)
4. `components/TeamCard.jsx` - Reusable component (~100 lines)
5. Updates to `pages/EventDetails.jsx` - Add team registration option (~150 lines)
6. Updates to `pages/OrganizerDashboard.jsx` - Team viewing (~100 lines)

**Total Estimated Lines:** ~2,000-2,200 lines

**Key Technical Challenges:**
- Team state management (forming → invited → complete)
- Handling partial team formations and cleanup
- Preventing duplicate invites and managing concurrent accepts
- Generating unique, collision-free invite codes
- Ensuring atomicity: all members get tickets or none do
- Deadline handling: what happens to incomplete teams?

---

### 🔧 Difficulty Level: **6.5/10**

**Easy Parts:**
- ✅ Basic model creation (you have similar patterns)
- ✅ Unique code generation (crypto.randomBytes)
- ✅ Email integration (already exists)
- ✅ QR code generation (already implemented)

**Moderate Parts:**
- ⚠️ Team state machine (5 states to manage)
- ⚠️ Invite acceptance flow and validation
- ⚠️ Frontend state management for team formation
- ⚠️ Real-time status updates in dashboard

**Hard Parts:**
- ❌ Transactional registration (must be atomic)
- ❌ Race condition handling (multiple accepts at once)
- ❌ Incomplete team cleanup logic
- ❌ Edge cases: team leader leaves, invite expires, event closes

**Leverage from Existing Code:**
- 70% - QR code generation already done
- 80% - Email service ready to extend
- 60% - Registration flow structure exists
- 50% - Dashboard patterns established

---

## Feature 2: Merchandise Payment Approval Workflow

### 📊 CV Value: ⭐⭐⭐⭐ (7.5/10)
**Why it's solid:**
- Shows **workflow automation** and **state machines** (pending → approved/rejected)
- Demonstrates **file upload** handling (payment proofs)
- Involves **admin/organizer review interfaces** 
- Showcases **conditional logic** (QR only on approval)
- Highlights **inventory management** (stock decrement on approval)
- **Real-world application**: Payment verification is common in e-commerce

**Resume Talking Points:**
- "Built payment verification workflow with image upload and approval system"
- "Implemented multi-state order management (pending/approved/rejected)"
- "Designed organizer dashboard for reviewing payment proofs"
- "Integrated conditional QR generation based on payment approval status"

---

### 💻 Code Complexity: **MODERATE**

**New Files Required (Backend):**
1. `models/MerchOrder.js` - New model (~70 lines) OR update Registration model (~40 lines)
2. `controllers/merchOrder.controller.js` - Order management (~250 lines)
3. `routes/merchOrder.routes.js` - API routes (~35 lines)
4. Middleware for file upload handling - `middleware/upload.js` (~50 lines)
5. Updates to `controllers/registration.controller.js` - Payment flow (~80 lines)
6. Updates to `utils/emailService.js` - Approval/rejection emails (~60 lines)
7. File storage configuration (multer/cloudinary) (~40 lines)

**New Files Required (Frontend):**
1. `pages/PaymentUpload.jsx` - Upload payment proof (~200 lines)
2. `pages/MerchOrderManagement.jsx` - Organizer approval interface (~350 lines)
3. `components/PaymentProofViewer.jsx` - Image viewer component (~150 lines)
4. Updates to `pages/EventDetails.jsx` - Payment upload flow (~80 lines)
5. Updates to `pages/OrganizerDashboard.jsx` - Orders tab (~100 lines)
6. Updates to `pages/MyEvents.jsx` - Show order status (~80 lines)

**Total Estimated Lines:** ~1,500-1,700 lines

**Key Technical Challenges:**
- File upload and storage (local or cloud)
- Image display and optimization
- State transitions (pending → approved/rejected)
- Stock management on approval (needs to be atomic)
- QR generation moved to approval stage
- Email notifications at each state change

---

### 🔧 Difficulty Level: **5/10**

**Easy Parts:**
- ✅ Basic state management (3 states only)
- ✅ File upload with multer (standard library)
- ✅ Email notifications (already implemented)
- ✅ QR code generation (already exists)
- ✅ Stock decrement logic (already in place)

**Moderate Parts:**
- ⚠️ File storage setup (need to choose local vs cloud)
- ⚠️ Image display in approval interface
- ⚠️ Order listing and filtering UI
- ⚠️ Payment proof validation

**Hard Parts:**
- ❌ Ensuring atomic stock updates on approval
- ❌ Handling file size limits and format validation
- ❌ Edge case: user cancels after uploading proof

**Leverage from Existing Code:**
- 90% - Registration flow structure exists
- 85% - QR and email services ready
- 80% - Merch variant system already built
- 70% - Stock management logic present
- 60% - Dashboard patterns established

---

## Feature 3: QR Scanner & Attendance Tracking

### 📊 CV Value: ⭐⭐⭐⭐⭐ (9.5/10)
**Why it's exceptional:**
- Demonstrates **real-time scanning** with camera integration
- Shows **hardware integration** (device camera access)
- Involves **duplicate prevention** and validation logic
- Showcases **live dashboards** with real-time data
- Highlights **data export** (CSV generation)
- Includes **audit logging** for manual overrides
- **Highly visible**: This is the kind of feature that impresses in demos

**Resume Talking Points:**
- "Implemented real-time QR code scanner with camera integration"
- "Built attendance tracking system with duplicate detection and timestamp logging"
- "Designed live attendance dashboard showing real-time participation metrics"
- "Created CSV export functionality for attendance reports"
- "Implemented audit logging system for manual attendance overrides"

---

### 💻 Code Complexity: **MODERATE**

**New Files Required (Backend):**
1. `models/Attendance.js` - Attendance records (~50 lines)
2. `controllers/attendance.controller.js` - Scan & track logic (~300 lines)
3. `routes/attendance.routes.js` - API routes (~40 lines)
4. `utils/csvExport.js` - CSV generation utility (~80 lines)
5. Updates to `controllers/event.controller.js` - Attendance endpoints (~60 lines)

**New Files Required (Frontend):**
1. `pages/QRScanner.jsx` - Camera scanner interface (~350 lines)
2. `pages/AttendanceDashboard.jsx` - Live attendance view (~400 lines)
3. `components/QRScannerComponent.jsx` - Reusable scanner (~250 lines)
4. `components/AttendanceTable.jsx` - Participant list (~200 lines)
5. `components/ManualOverride.jsx` - Manual attendance modal (~150 lines)
6. Updates to `pages/OrganizerDashboard.jsx` - Attendance tab (~80 lines)
7. QR scanner library setup (react-qr-scanner or html5-qrcode)

**Total Estimated Lines:** ~1,900-2,100 lines

**Key Technical Challenges:**
- Camera access and permissions handling
- QR code scanning with different libraries
- Real-time dashboard updates
- Duplicate scan prevention logic
- CSV generation with proper formatting
- File upload for QR images (alternative to camera)
- Audit trail for manual overrides
- Performance with large attendee lists

---

### 🔧 Difficulty Level: **6/10**

**Easy Parts:**
- ✅ Attendance model and basic CRUD
- ✅ Duplicate detection (simple query)
- ✅ CSV export (existing libraries)
- ✅ Manual override UI

**Moderate Parts:**
- ⚠️ QR scanning library integration
- ⚠️ Camera permission handling
- ⚠️ Real-time dashboard updates
- ⚠️ File upload for QR images
- ⚠️ Timestamp and status management

**Hard Parts:**
- ❌ Camera integration and testing (needs physical device)
- ❌ QR code format validation and decoding
- ❌ Handling camera errors gracefully
- ❌ Performance optimization for live updates
- ❌ Cross-browser camera compatibility

**Leverage from Existing Code:**
- 90% - QR code format already defined
- 70% - Dashboard patterns exist
- 60% - Event and registration models ready
- 50% - Authentication for organizer access
- 30% - New territory: camera integration

---

## 🎯 RECOMMENDATION

### **Best Combination: Features #1 + #3**
**Reasoning:**

✅ **Maximum CV Impact**
- Both are unique, impressive features
- Show diverse technical skills (team collaboration + hardware integration)
- Highly demonstrable in interviews

✅ **Complementary Skillset**
- Feature #1: Backend-heavy, state management, transactional logic
- Feature #3: Frontend-heavy, hardware integration, real-time updates
- Together they show full-stack mastery

✅ **Manageable Complexity**
- Combined: ~4,100 lines (distributed across stack)
- Both leverage existing code well
- Challenges are different, not overlapping

✅ **Impressive Demo**
- Team registration is intuitive to explain
- QR scanner is visually impressive during demos
- Both are "wow" features recruiters understand

---

### **Alternative: Features #2 + #3**
**If you want slightly easier implementation:**

✅ **More Leverages Existing Code**
- Feature #2 reuses 80%+ of current registration system
- Feature #3 is standalone and modular

✅ **Less Backend Complexity**
- No complex transactional logic (like team atomicity)
- Simpler state machines

✅ **Still Great for CV**
- Payment workflow shows e-commerce understanding
- QR scanner remains the star feature

⚠️ **Slight Drawbacks:**
- Less unique (payment approval is more common)
- Less impressive than team registration for hackathon platforms

---

## ⏱️ Time Estimates

| Feature | Backend Time | Frontend Time | Testing Time | Total |
|---------|-------------|--------------|-------------|-------|
| **Feature #1: Team Registration** | 12-15 hours | 10-12 hours | 4-6 hours | **26-33 hours** |
| **Feature #2: Payment Approval** | 8-10 hours | 8-10 hours | 3-4 hours | **19-24 hours** |
| **Feature #3: QR Scanner** | 8-10 hours | 12-15 hours | 5-7 hours | **25-32 hours** |

**Combinations:**
- **#1 + #3**: 51-65 hours (~1.5-2 weeks full-time)
- **#2 + #3**: 44-56 hours (~1-1.5 weeks full-time)
- **#1 + #2**: 45-57 hours (~1-1.5 weeks full-time)

---

## 🎓 Learning Value

| Feature | New Technologies | Skill Development |
|---------|-----------------|-------------------|
| **#1** | State machines, invite systems | Complex workflows, transactional logic |
| **#2** | File uploads (multer), image handling | E-commerce patterns, approval workflows |
| **#3** | Camera APIs, QR libraries, CSV export | Hardware integration, real-time systems |

**Most Learning**: Feature #3 (completely new territory)
**Most Industry-Relevant**: Feature #1 (team collaboration is everywhere)
**Easiest to Complete**: Feature #2 (builds on existing patterns)

---

## 🏆 Final Verdict

**Go with Features #1 + #3** for maximum impact if you have ~2 weeks.

**Go with Features #2 + #3** if you need to finish faster or want guaranteed success.

**Avoid #1 + #2** together as they're both backend-heavy and less exciting for demos.

---

# TIER B: Real-time & Communication Features [Choose 2 — 6 Marks Each]

---

## Feature B1: Real-Time Discussion Forum

### 📊 CV Value: ⭐⭐⭐⭐⭐ (9/10)
**Why it's impressive:**
- Demonstrates **WebSocket/real-time** communication
- Shows **moderation capabilities** (CRUD with authorization)
- Involves **notification system** integration
- Showcases **message threading** (nested data structures)
- Highlights **reaction system** (social features)
- **Highly relevant**: Forums are standard in modern platforms

**Resume Talking Points:**
- "Built real-time discussion forum with WebSocket integration"
- "Implemented message threading and reaction system"
- "Designed role-based moderation with pin/delete capabilities"
- "Created real-time notification system for new messages"

---

### 💻 Code Complexity: **HIGH**

**New Technologies Required:**
- Socket.io (WebSocket library) - Backend & Frontend
- Real-time state management
- Event-driven architecture

**New Files Required (Backend):**
1. `models/ForumMessage.js` - Message model (~80 lines)
2. `models/ForumReaction.js` - Reaction model (~50 lines)
3. `controllers/forum.controller.js` - Message CRUD (~300 lines)
4. `routes/forum.routes.js` - API routes (~50 lines)
5. `sockets/forumSocket.js` - WebSocket handlers (~200 lines)
6. Updates to `server.js` - Socket.io setup (~30 lines)
7. `middleware/socketAuth.js` - Socket authentication (~40 lines)
8. Updates to `utils/emailService.js` - Forum notifications (~40 lines)

**New Files Required (Frontend):**
1. `pages/EventForum.jsx` - Main forum interface (~500 lines)
2. `components/MessageThread.jsx` - Thread display (~250 lines)
3. `components/MessageInput.jsx` - Rich text input (~150 lines)
4. `components/ReactionPicker.jsx` - Emoji reactions (~100 lines)
5. `components/ModeratorTools.jsx` - Pin/delete UI (~150 lines)
6. `hooks/useSocket.js` - Socket.io React hook (~100 lines)
7. Updates to `App.jsx` - Socket context provider (~50 lines)

**Total Estimated Lines:** ~2,100-2,300 lines

**Key Technical Challenges:**
- Real-time message synchronization across clients
- Handling connection drops and reconnections
- Message ordering and threading logic
- Notification management (not spamming users)
- Scalability: many users in one room
- Optimistic UI updates
- Rate limiting to prevent spam

---

### 🔧 Difficulty Level: **7.5/10**

**Easy Parts:**
- ✅ Basic message CRUD
- ✅ User authorization for moderation
- ✅ Pin/delete functionality

**Moderate Parts:**
- ⚠️ Socket.io integration and setup
- ⚠️ Message threading structure
- ⚠️ Reaction system
- ⚠️ Notification triggers

**Hard Parts:**
- ❌ Real-time synchronization across multiple clients
- ❌ Connection state management
- ❌ Race conditions in concurrent updates
- ❌ Optimistic UI updates with rollback
- ❌ Testing real-time features
- ❌ Performance with large message history

**Leverage from Existing Code:**
- 60% - Authentication system ready
- 50% - Email notification infrastructure
- 40% - Dashboard patterns
- 10% - **New territory: WebSockets**

---

## Feature B2: Organizer Password Reset Workflow

### 📊 CV Value: ⭐⭐⭐ (6/10)
**Why it's decent:**
- Shows **admin approval workflow** patterns
- Demonstrates **security considerations** 
- Involves **auto-generation** of passwords
- Showcases **state tracking** (pending/approved/rejected)
- Highlights **audit trail** (request history)

**Resume Talking Points:**
- "Implemented secure password reset workflow with admin approval"
- "Built request management system with status tracking"
- "Designed auto-password generation with secure delivery"
- "Created audit logging for security events"

**⚠️ Caveat:** Less impressive than other features - password reset is common and expected.

---

### 💻 Code Complexity: **LOW**

**New Files Required (Backend):**
1. `models/PasswordResetRequest.js` - Request model (~70 lines)
2. `controllers/passwordReset.controller.js` - CRUD operations (~200 lines)
3. `routes/passwordReset.routes.js` - API routes (~40 lines)
4. `utils/passwordGenerator.js` - Auto-generate passwords (~30 lines)
5. Updates to `utils/emailService.js` - Reset notifications (~50 lines)

**New Files Required (Frontend):**
1. `pages/RequestPasswordReset.jsx` - Organizer request form (~150 lines)
2. `pages/AdminPasswordRequests.jsx` - Admin management UI (~350 lines)
3. `components/PasswordRequestCard.jsx` - Request display (~100 lines)
4. Updates to `pages/AdminDashboard.jsx` - Add requests tab (~50 lines)
5. Updates to `pages/OrganizerProfile.jsx` - Request link (~30 lines)

**Total Estimated Lines:** ~1,070-1,200 lines

**Key Technical Challenges:**
- Password generation with proper entropy
- Secure password delivery (admin receives it)
- Request validation and authorization
- Preventing duplicate requests
- History tracking

---

### 🔧 Difficulty Level: **3.5/10**

**Easy Parts:**
- ✅ Request model and CRUD
- ✅ Admin approval/reject logic
- ✅ Status tracking (simple enum)
- ✅ Email notifications (already set up)
- ✅ Password generation (crypto.randomBytes)

**Moderate Parts:**
- ⚠️ Admin UI for reviewing requests
- ⚠️ Request filtering and search
- ⚠️ Proper validation

**Hard Parts:**
- ❌ None really - straightforward feature

**Leverage from Existing Code:**
- 90% - Admin dashboard patterns exist
- 85% - Email service ready
- 80% - Authentication and user management
- 75% - Status tracking patterns (similar to events)

---

## Feature B3: Team Chat

### 📊 CV Value: ⭐⭐⭐⭐⭐ (9.5/10)
**Why it's exceptional:**
- Demonstrates **real-time chat** implementation
- Shows **presence indicators** (online status)
- Involves **typing indicators** (sophisticated real-time)
- Showcases **file sharing** capabilities
- Highlights **notification system**
- **Industry-standard**: Chat is a core skill
- **Synergy**: Builds on Team Registration (Tier A #1)

**Resume Talking Points:**
- "Developed real-time team chat with WebSocket technology"
- "Implemented presence indicators and typing notifications"
- "Built file sharing system with chat integration"
- "Designed notification system for unread messages"

---

### 💻 Code Complexity: **HIGH**

**Prerequisites:** Requires Tier A Feature #1 (Team Registration)

**New Technologies Required:**
- Socket.io (WebSocket library)
- File upload/storage (for file sharing)
- Real-time state management

**New Files Required (Backend):**
1. `models/TeamMessage.js` - Message model (~70 lines)
2. `models/TeamFile.js` - File metadata model (~50 lines)
3. `controllers/teamChat.controller.js` - Chat operations (~250 lines)
4. `routes/teamChat.routes.js` - API routes (~40 lines)
5. `sockets/teamChatSocket.js` - WebSocket handlers (~300 lines)
6. `middleware/upload.js` - File upload handling (~60 lines)
7. Updates to `utils/emailService.js` - Chat notifications (~40 lines)

**New Files Required (Frontend):**
1. `pages/TeamChat.jsx` - Main chat interface (~600 lines)
2. `components/ChatMessage.jsx` - Message component (~150 lines)
3. `components/ChatInput.jsx` - Message input (~200 lines)
4. `components/TypingIndicator.jsx` - Typing animation (~80 lines)
5. `components/OnlineStatus.jsx` - Presence indicator (~100 lines)
6. `components/FileUpload.jsx` - File sharing UI (~150 lines)
7. `hooks/useTeamChat.js` - Chat socket hook (~200 lines)

**Total Estimated Lines:** ~2,290-2,500 lines

**Key Technical Challenges:**
- Real-time message delivery to team members only
- Online/offline status tracking
- Typing indicator with debouncing
- File upload and storage
- Message history pagination
- Unread message counting
- Notification management (desktop + in-app)

---

### 🔧 Difficulty Level: **8/10**

**Easy Parts:**
- ✅ Basic message sending/receiving
- ✅ Message history display

**Moderate Parts:**
- ⚠️ Socket.io integration
- ⚠️ Team-based room management
- ⚠️ File upload handling
- ⚠️ Notification system

**Hard Parts:**
- ❌ Typing indicators with proper state management
- ❌ Online presence tracking (handle disconnects)
- ❌ Real-time synchronization
- ❌ Unread message counting across sessions
- ❌ File sharing with progress indicators
- ❌ Performance with message history

**Leverage from Existing Code:**
- 70% - Team model from Tier A #1
- 60% - Authentication system
- 50% - Notification patterns
- 20% - **New territory: Chat and WebSockets**

---

# TIER C: Integration & Enhancement Features [Choose 1 — 2 Marks Each]

---

## Feature C1: Anonymous Feedback System

### 📊 CV Value: ⭐⭐⭐ (6/10)
**Why it's solid:**
- Shows **data aggregation** skills
- Demonstrates **analytics** capabilities
- Involves **export functionality**
- Showcases **anonymity handling**

**Resume Talking Points:**
- "Built anonymous feedback system with star ratings"
- "Implemented aggregated analytics dashboard"
- "Created data export functionality for feedback analysis"

---

### 💻 Code Complexity: **LOW**

**New Files Required (Backend):**
1. `models/Feedback.js` - Feedback model (~60 lines)
2. `controllers/feedback.controller.js` - CRUD + analytics (~180 lines)
3. `routes/feedback.routes.js` - API routes (~35 lines)
4. `utils/feedbackExport.js` - CSV/JSON export (~50 lines)

**New Files Required (Frontend):**
1. `pages/SubmitFeedback.jsx` - Feedback form (~200 lines)
2. `pages/FeedbackDashboard.jsx` - Organizer view (~300 lines)
3. `components/StarRating.jsx` - Rating component (~100 lines)
4. `components/FeedbackStats.jsx` - Statistics display (~150 lines)

**Total Estimated Lines:** ~1,075 lines

**Difficulty:** 3/10 (Very straightforward)

---

## Feature C2: Add to Calendar Integration

### 📊 CV Value: ⭐⭐⭐⭐ (7.5/10)
**Why it's good:**
- Shows **external integration** skills
- Demonstrates **standard format** knowledge (.ics)
- Involves **timezone handling** (important!)
- Showcases **multi-platform** support

**Resume Talking Points:**
- "Implemented calendar export with .ics file generation"
- "Built integrations for Google Calendar and Outlook"
- "Handled timezone conversion for international events"

---

### 💻 Code Complexity: **LOW-MODERATE**

**New Files Required (Backend):**
1. `utils/calendarService.js` - .ics generation (~150 lines)
2. `controllers/calendar.controller.js` - Export endpoints (~100 lines)
3. `routes/calendar.routes.js` - API routes (~30 lines)

**New Files Required (Frontend):**
1. `components/CalendarExport.jsx` - Export buttons (~200 lines)
2. Updates to `pages/EventDetails.jsx` - Add export option (~50 lines)
3. Updates to `pages/MyEvents.jsx` - Batch export (~80 lines)

**Total Estimated Lines:** ~610 lines

**New Libraries:**
- `ics` (npm package for .ics generation)
- `moment-timezone` or `date-fns-tz` (timezone handling)

**Difficulty:** 4/10 (Moderate - timezone handling tricky)

---

## Feature C3: Bot Protection

### 📊 CV Value: ⭐⭐⭐⭐ (7/10)
**Why it's good:**
- Shows **security awareness**
- Demonstrates **third-party integration** (reCAPTCHA)
- Involves **rate limiting** (important concept)
- Showcases **IP tracking** and blocking

**Resume Talking Points:**
- "Implemented bot protection with Google reCAPTCHA"
- "Built rate limiting and IP blocking system"
- "Created security monitoring dashboard for admin"

---

### 💻 Code Complexity: **LOW-MODERATE**

**New Files Required (Backend):**
1. `middleware/captcha.js` - CAPTCHA verification (~60 lines)
2. `middleware/rateLimit.js` - Rate limiting logic (~80 lines)
3. `models/SecurityEvent.js` - Event logging (~50 lines)
4. `controllers/security.controller.js` - Security dashboard (~120 lines)
5. `routes/security.routes.js` - API routes (~30 lines)
6. Updates to `routes/auth.routes.js` - Add CAPTCHA middleware (~10 lines)

**New Files Required (Frontend):**
1. `components/ReCaptcha.jsx` - CAPTCHA component (~80 lines)
2. `pages/SecurityDashboard.jsx` - Admin security view (~250 lines)
3. Updates to `pages/Login.jsx` - Add CAPTCHA (~30 lines)
4. Updates to `pages/Register.jsx` - Add CAPTCHA (~30 lines)

**Total Estimated Lines:** ~720 lines

**New Libraries:**
- `express-rate-limit` (rate limiting)
- `react-google-recaptcha` (frontend CAPTCHA)
- Google reCAPTCHA API setup

**Difficulty:** 4.5/10 (Moderate - external API integration)

---

# 🎯 COMPLETE RECOMMENDATIONS

## Strategy for Maximum Points (Tier A + B + C)

### **OPTION 1: Maximum CV Impact + Challenge**
**Total: 8 + 8 + 6 + 6 + 2 = 30 marks**

**Tier A (16 marks):**
- ✅ Feature #1: Team Registration (8 marks)
- ✅ Feature #3: QR Scanner & Attendance (8 marks)

**Tier B (12 marks):**
- ✅ Feature B1: Real-Time Discussion Forum (6 marks)
- ✅ Feature B3: Team Chat (6 marks) - *synergizes with Team Registration*

**Tier C (2 marks):**
- ✅ Feature C2: Add to Calendar (2 marks)

**Why this combination?**
- 🌟 **Most impressive for CV** - Real-time features, team collaboration, hardware integration
- 🌟 **Shows diverse skills** - WebSockets, state management, camera APIs, calendar formats
- 🌟 **Great demos** - All features are visually impressive
- ⚠️ **High difficulty** - WebSockets are new territory
- ⏱️ **Time**: ~70-85 hours (2-2.5 weeks full-time)

---

### **OPTION 2: Balanced Difficulty + Strong CV**
**Total: 8 + 8 + 6 + 6 + 2 = 30 marks**

**Tier A (16 marks):**
- ✅ Feature #2: Merchandise Payment Approval (8 marks)
- ✅ Feature #3: QR Scanner & Attendance (8 marks)

**Tier B (12 marks):**
- ✅ Feature B1: Real-Time Discussion Forum (6 marks)
- ✅ Feature B2: Password Reset Workflow (6 marks) - *easiest B tier*

**Tier C (2 marks):**
- ✅ Feature C3: Bot Protection (2 marks)

**Why this combination?**
- ✅ **More balanced difficulty** - Mix of easy and moderate features
- ✅ **Still impressive** - Real-time forum, QR scanner, security features
- ✅ **Good CV value** - Shows full-stack + real-time + security
- ⏱️ **Time**: ~55-70 hours (1.5-2 weeks full-time)

---

### **OPTION 3: Fastest Completion + Solid CV**
**Total: 8 + 8 + 6 + 6 + 2 = 30 marks**

**Tier A (16 marks):**
- ✅ Feature #2: Merchandise Payment Approval (8 marks)
- ✅ Feature #3: QR Scanner & Attendance (8 marks)

**Tier B (12 marks):**
- ✅ Feature B2: Password Reset Workflow (6 marks) - *easiest*
- ✅ Feature B1: Real-Time Discussion Forum (6 marks) - *or you could skip this*

**Wait, you only need 2 from Tier B, so:**
- ✅ Feature B2: Password Reset Workflow (6 marks)
- ✅ Feature B1: Real-Time Discussion Forum (6 marks)

**Tier C (2 marks):**
- ✅ Feature C2: Add to Calendar (2 marks)

**Why this combination?**
- ✅ **Fastest to complete** - Leverages existing code heavily
- ✅ **Lower risk** - Less new technology
- ✅ **Still good for CV** - QR scanner + forum + calendar export
- ⏱️ **Time**: ~48-60 hours (1-1.5 weeks full-time)

---

## 📊 Detailed Time Breakdown

| Feature | Lines | Difficulty | Time |
|---------|-------|-----------|------|
| **Tier A #1**: Team Registration | 2,000-2,200 | 6.5/10 | 26-33h |
| **Tier A #2**: Payment Approval | 1,500-1,700 | 5/10 | 19-24h |
| **Tier A #3**: QR Scanner | 1,900-2,100 | 6/10 | 25-32h |
| **Tier B #1**: Discussion Forum | 2,100-2,300 | 7.5/10 | 28-35h |
| **Tier B #2**: Password Reset | 1,070-1,200 | 3.5/10 | 12-16h |
| **Tier B #3**: Team Chat | 2,290-2,500 | 8/10 | 30-38h |
| **Tier C #1**: Feedback System | 1,075 | 3/10 | 10-13h |
| **Tier C #2**: Calendar Export | 610 | 4/10 | 6-8h |
| **Tier C #3**: Bot Protection | 720 | 4.5/10 | 7-10h |

---

## 🏆 MY FINAL RECOMMENDATION

### **Go with OPTION 2 (Balanced Difficulty + Strong CV)**

**Your feature set:**
1. ✅ **Tier A**: Merchandise Payment Approval (8 marks)
2. ✅ **Tier A**: QR Scanner & Attendance (8 marks)
3. ✅ **Tier B**: Real-Time Discussion Forum (6 marks)
4. ✅ **Tier B**: Password Reset Workflow (6 marks)
5. ✅ **Tier C**: Bot Protection (2 marks)

**Why this is the sweet spot:**

✅ **Manageable complexity**
- One easy feature (Password Reset)
- Two moderate features (Payment, Bot Protection)
- Two challenging features (QR Scanner, Forum)

✅ **Impressive for CV**
- Real-time WebSocket communication (Forum)
- Hardware integration (QR Scanner)
- Security awareness (Bot Protection)
- Payment workflows (Merch Approval)

✅ **Time-efficient**
- Total: ~55-70 hours
- Can complete in 2 weeks with focused work
- Lower risk than Option 1

✅ **Great demo value**
- QR Scanner is visually impressive
- Forum shows real-time updates
- Payment workflow shows complete flow

**Alternative if you want maximum impact and have time:**
- Choose **OPTION 1** for best CV but expect 70-85 hours

**Alternative if you're short on time:**
- Skip Forum, add Calendar Export instead (saves ~22 hours)
- Total becomes ~41-48 hours

Would you like me to start implementing any of these features?
