const Event = require("../models/Event");
const Organizer = require("../models/Organizer");

const createEvent = async (req, res) => {
  try {
    const organizer = await Organizer.findOne({ user: req.user.id });
    if (!organizer) {
      return res.status(403).json({ message: "Not an organizer" });
    }

    const event = await Event.create({
      ...req.body,
      organizer: organizer._id,
    });

    return res.status(201).json(event);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const publishEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    event.status = "PUBLISHED";
    await event.save();

    return res.json({ message: "Event published" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


const listEvents = async (req, res) => {
  const events = await Event.find({ status: "PUBLISHED" }).populate(
    "organizer",
    "name category"
  );
  res.json(events);
};

module.exports = { createEvent, publishEvent, listEvents };
