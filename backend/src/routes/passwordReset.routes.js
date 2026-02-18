const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const { ORGANIZER, ADMIN } = require("../utils/roles");
const {
  requestPasswordReset,
  getMyResetRequests,
  getAllResetRequests,
  approveResetRequest,
  rejectResetRequest,
  getOrganizerResetHistory,
} = require("../controllers/passwordReset.controller");
router.post("/request", requireAuth, requireRole([ORGANIZER]), requestPasswordReset);
router.get("/my-requests", requireAuth, requireRole([ORGANIZER]), getMyResetRequests);
router.get("/all", requireAuth, requireRole([ADMIN]), getAllResetRequests);
router.post("/:requestId/approve", requireAuth, requireRole([ADMIN]), approveResetRequest);
router.post("/:requestId/reject", requireAuth, requireRole([ADMIN]), rejectResetRequest);
router.get("/history/:organizerId", requireAuth, requireRole([ADMIN]), getOrganizerResetHistory);
module.exports = router;
