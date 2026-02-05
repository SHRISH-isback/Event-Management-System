const Event = require("../models/Event");
const Registration = require("../models/Registration");
const crypto = require("crypto");

const registerForEvent = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const participantId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event || event.status !== "PUBLISHED") {
      return res.status(400).json({ message: "Event not available" });
    }

    if (event.registrationDeadline) {
      if (new Date() > event.registrationDeadline) {
        return res.status(400).json({ message: "Registration closed" });
      }
    }

    const alreadyRegistered = await Registration.findOne({
      participant: participantId,
      event: eventId,
    });

    if (alreadyRegistered) {
      return res.status(400).json({ message: "Already registered" });
    }

    if (event.registrationLimit) {
      const count = await Registration.countDocuments({
        event: eventId,
        status: "REGISTERED",
      });

      if (count >= event.registrationLimit) {
        return res.status(400).json({ message: "Event is full" });
      }
    }

    const ticketId = crypto.randomBytes(6).toString("hex");

    const registration = await Registration.create({
      participant: participantId,
      event: eventId,
      ticketId,
    });

    res.status(201).json({
      message: "Registered successfully",
      ticketId: registration.ticketId,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({
      participant: req.user.id,
      status: "REGISTERED",
    })
      .populate("event", "name description startDate endDate organizer")
      .sort({ createdAt: -1 });

    res.json(registrations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
module.exports = { registerForEvent ,getRegistrations};
