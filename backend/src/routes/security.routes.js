const express = require("express");
const router = express.Router();
const securityController = require("../controllers/security.controller");
const { verifyToken, verifyAdmin } = require("../middleware/auth");

router.use(verifyToken, verifyAdmin);
router.get("/events", securityController.getSecurityEvents);
router.get("/stats", securityController.getSecurityStats);
router.patch("/events/:eventId/resolve", securityController.resolveSecurityEvent);
router.get("/blocked-ips", securityController.getBlockedIPs);
router.post("/blocked-ips", securityController.blockIP);
router.delete("/blocked-ips/:ipAddress", securityController.unblockIP);
router.post("/events/cleanup", securityController.deleteOldEvents);
module.exports = router;
