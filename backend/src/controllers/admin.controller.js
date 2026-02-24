const User = require("../models/User");
const Organizer = require("../models/Organizer");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const ForumMessage = require("../models/ForumMessage");
const PasswordResetRequest = require("../models/PasswordResetRequest");
const { ORGANIZER } = require("../utils/roles");

const createOrganizer = async (req, res) => {
  try {
    const { email, name, category, description, contactEmail } = req.body;

    if (!email || !name) return res.status(400).json({ message: "Missing required fields" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Auto-generate a temporary password for the new organizer
    const generatedPassword = Math.random().toString(36).slice(-8);

    const user = await User.create({ email, password: generatedPassword, role: ORGANIZER });
    await Organizer.create({ user: user._id, name, category, description, contactEmail });

    return res.status(201).json({
      message: "Organizer created successfully",
      credentials: { email, password: generatedPassword },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getAllOrganizers = async (req, res) => {
  try {
    const organizers = await Organizer.find()
      .populate("user", "email isActive")
      .sort({ createdAt: -1 });
    res.json(organizers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const toggleOrganizerStatus = async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.id).populate("user");
    if (!organizer) return res.status(404).json({ message: "Organizer not found" });

    const user = await User.findById(organizer.user._id);
    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `Organizer ${user.isActive ? "activated" : "deactivated"} successfully`,
      isActive: user.isActive,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteOrganizer = async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.id);
    if (!organizer) return res.status(404).json({ message: "Organizer not found" });

    const events = await Event.find({ organizer: organizer._id });
    const eventIds = events.map((e) => e._id);

    let deletedRegistrations = 0;
    let deletedForumMessages = 0;

    if (eventIds.length > 0) {
      // Cascade delete all event-related data
      ({ deletedCount: deletedRegistrations } = await Registration.deleteMany({ event: { $in: eventIds } }));
      ({ deletedCount: deletedForumMessages } = await ForumMessage.deleteMany({ event: { $in: eventIds } }));
      await Event.deleteMany({ organizer: organizer._id });
    }

    await PasswordResetRequest.deleteMany({ organizer: organizer._id });
    await Organizer.findByIdAndDelete(req.params.id);
    await User.findByIdAndDelete(organizer.user);

    res.json({
      message: "Organizer and all associated data permanently removed",
      deleted: { events: eventIds.length, registrations: deletedRegistrations, forumMessages: deletedForumMessages },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createOrganizer, getAllOrganizers, toggleOrganizerStatus, deleteOrganizer };
