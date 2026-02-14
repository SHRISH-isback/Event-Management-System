const express = require("express");
const router = express.Router();

const { 
  registerForEvent,
  getMyRegistrations,
  getEventRegistrations,
  checkRegistration,
  getRegistrationCount,
  verifyTicket,
  resendConfirmationEmail,
  exportToCalendar,
  exportBatchToCalendar,
  getCalendarLinks
} = require("../controllers/registration.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

router.post(
  "/:eventId",
  requireAuth,
  requireRole("PARTICIPANT"),
  registerForEvent
);

router.get(
  "/my",
  requireAuth,
  requireRole("PARTICIPANT"),
  getMyRegistrations
);

router.get(
  "/event/:eventId",
  requireAuth,
  requireRole("ORGANIZER"),
  getEventRegistrations
);

router.get(
  "/check/:eventId",
  requireAuth,
  requireRole("PARTICIPANT"),
  checkRegistration
);

router.get(
  "/count/:eventId",
  getRegistrationCount
);

router.get(
  "/verify/:ticketId",
  requireAuth,
  requireRole("ORGANIZER"),
  verifyTicket
);

router.post(
  "/resend/:registrationId",
  requireAuth,
  requireRole("PARTICIPANT"),
  resendConfirmationEmail
);

router.get(
  "/calendar/export/:registrationId",
  requireAuth,
  requireRole("PARTICIPANT"),
  exportToCalendar
);

router.post(
  "/calendar/export/batch",
  requireAuth,
  requireRole("PARTICIPANT"),
  exportBatchToCalendar
);

router.get(
  "/calendar/links/:registrationId",
  requireAuth,
  requireRole("PARTICIPANT"),
  getCalendarLinks
);

module.exports = router;
