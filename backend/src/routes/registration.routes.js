const express = require("express");
const router = express.Router();

const { 
  registerForEvent,
  getMyRegistrations,
  getEventRegistrations,
  checkRegistration,
  getRegistrationCount,
  verifyTicket,
  resendConfirmationEmail
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

module.exports = router;
