const express = require("express");
const router = express.Router();

const { createOrganizer } = require("../controllers/admin.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const { ADMIN } = require("../utils/roles");

router.post(
  "/organizers",
  requireAuth,
  requireRole(ADMIN),
  createOrganizer
);

module.exports = router;
