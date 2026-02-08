const express = require("express");
const router = express.Router();

const { 
  createOrganizer, 
  getAllOrganizers, 
  toggleOrganizerStatus, 
  deleteOrganizer 
} = require("../controllers/admin.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const { ADMIN } = require("../utils/roles");

router.post(
  "/organizers",
  requireAuth,
  requireRole(ADMIN),
  createOrganizer
);

router.get(
  "/organizers",
  requireAuth,
  requireRole(ADMIN),
  getAllOrganizers
);

router.patch(
  "/organizers/:id/toggle",
  requireAuth,
  requireRole(ADMIN),
  toggleOrganizerStatus
);

router.delete(
  "/organizers/:id",
  requireAuth,
  requireRole(ADMIN),
  deleteOrganizer
);

module.exports = router;
