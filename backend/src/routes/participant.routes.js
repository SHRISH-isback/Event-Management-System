const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const { PARTICIPANT } = require("../utils/roles");
const {
  updatePreferences,
  getProfile,
  updateProfile,
} = require("../controllers/participant.controller");

router.put("/preferences", requireAuth, requireRole(PARTICIPANT), updatePreferences);
router.get("/profile", requireAuth, requireRole(PARTICIPANT), getProfile);
router.put("/profile", requireAuth, requireRole(PARTICIPANT), updateProfile);

module.exports = router;
