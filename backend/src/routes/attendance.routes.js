const express = require("express");
const router = express.Router();

const {
  scanQRCode,
  getAttendanceDashboard,
  manualAttendanceOverride,
  exportAttendanceReport,
  getAttendanceAuditLog,
} = require("../controllers/attendance.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

router.post(
  "/scan",
  requireAuth,
  requireRole("ORGANIZER"),
  scanQRCode
);

router.get(
  "/dashboard/:eventId",
  requireAuth,
  requireRole("ORGANIZER"),
  getAttendanceDashboard
);

router.post(
  "/manual/:registrationId",
  requireAuth,
  requireRole("ORGANIZER"),
  manualAttendanceOverride
);

router.get(
  "/export/:eventId",
  requireAuth,
  requireRole("ORGANIZER"),
  exportAttendanceReport
);

router.get(
  "/audit/:eventId",
  requireAuth,
  requireRole("ORGANIZER"),
  getAttendanceAuditLog
);

module.exports = router;
