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
  getCalendarLinks,
  uploadPaymentProof,
  getPendingMerchOrders,
  approvePayment,
  rejectPayment,
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
  requireRole(["ORGANIZER", "ADMIN"]),
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

router.post(
  "/payment-proof/:registrationId",
  requireAuth,
  requireRole("PARTICIPANT"),
  uploadPaymentProof
);

router.get(
  "/pending-orders/:organizerId",
  requireAuth,
  requireRole("ORGANIZER"),
  getPendingMerchOrders
);

router.post(
  "/approve-payment/:registrationId",
  requireAuth,
  requireRole("ORGANIZER"),
  approvePayment
);

router.post(
  "/reject-payment/:registrationId",
  requireAuth,
  requireRole("ORGANIZER"),
  rejectPayment
);

module.exports = router;
