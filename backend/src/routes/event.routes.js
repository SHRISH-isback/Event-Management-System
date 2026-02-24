const express = require("express");
const router = express.Router();

const {
  createEvent,
  publishEvent,
  updateEvent,
  getMyEvents,
  getMyOngoingEvents,
  getAllEvents,
  getEventById,
  getTrendingEvents,
  getEventAnalytics,
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
router.patch(
  "/:id",
  requireAuth,
  requireRole(ORGANIZER),
  updateEvent
);

router.get(
  "/my",
  requireAuth,
  requireRole(ORGANIZER),
  getMyEvents
);
router.get(
  "/my/ongoing",
  requireAuth,
  requireRole(ORGANIZER),
  getMyOngoingEvents
);
router.get(
  "/:id/analytics",
  requireAuth,
  requireRole(ORGANIZER),
  getEventAnalytics
);

router.get("/trending", getTrendingEvents);
router.get("/", getAllEvents);
router.get("/:id", getEventById);

module.exports = router;
