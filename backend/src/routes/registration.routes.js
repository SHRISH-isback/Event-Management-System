const express = require("express");
const router = express.Router();

const { registerForEvent } = require("../controllers/registration.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const { getRegistrations } = require("../controllers/registration.controller");

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
  getRegistrations
);

module.exports = router;
