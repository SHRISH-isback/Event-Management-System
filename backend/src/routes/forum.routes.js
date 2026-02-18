const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const { ORGANIZER, PARTICIPANT } = require("../utils/roles");
const {
  getEventMessages,
  postMessage,
  postAnnouncement,
  deleteMessage,
  togglePinMessage,
  addReaction,
  removeReaction,
} = require("../controllers/forum.controller");

router.get("/:eventId/messages", requireAuth, getEventMessages);
router.post("/:eventId/messages", requireAuth, postMessage);
router.post("/:eventId/announcements", requireAuth, requireRole([ORGANIZER]), postAnnouncement);
router.delete("/messages/:messageId", requireAuth, deleteMessage);
router.patch("/messages/:messageId/pin", requireAuth, requireRole([ORGANIZER]), togglePinMessage);
router.post("/messages/:messageId/reactions", requireAuth, addReaction);
router.delete("/messages/:messageId/reactions", requireAuth, removeReaction);
module.exports = router;
