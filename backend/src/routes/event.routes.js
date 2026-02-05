const express = require("express");
const router = express.Router();

const {
  createEvent,
  publishEvent,
  getMyEvents,
  getAllEvents,
  getEventById,
} = require("../controllers/event.controller");

const { requireAuth, requireRole } = require("../middleware/auth");
const { ORGANIZER } = require("../utils/roles");

router.post("/", requireAuth, requireRole(ORGANIZER), createEvent);

router.patch(
  "/:id/publish",
  requireAuth,
  requireRole(ORGANIZER),
  publishEvent
);
router.get(
  "/my",
  requireAuth,
  requireRole("ORGANIZER"),
  getMyEvents
);
router.get("/", getAllEvents);
router.get("/:id", getEventById);

module.exports = router;
