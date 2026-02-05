const express = require("express");
const router = express.Router();
const Organizer = require("../models/Organizer");
const { requireAuth, requireRole } = require("../middleware/auth");
const { ORGANIZER } = require("../utils/roles");
const { getProfile, updateProfile, testWebhook } = require("../controllers/organizer.controller");

router.get("/", async (req, res) => {
  try {
    const organizers = await Organizer.find()
      .populate("user", "isActive")
      .sort({ createdAt: -1 });
    
    const activeOrganizers = organizers.filter(org => org.user.isActive);
    
    res.json(activeOrganizers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.id)
      .populate("user", "isActive email");
    
    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    res.json(organizer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/profile/me", requireAuth, requireRole(ORGANIZER), getProfile);
router.put("/profile", requireAuth, requireRole(ORGANIZER), updateProfile);
router.post("/test-webhook", requireAuth, requireRole(ORGANIZER), testWebhook);

module.exports = router;
