const Event = require("../models/Event");
const Organizer = require("../models/Organizer");
const Registration = require("../models/Registration");
const ParticipantProfile = require("../models/Participant");
const { postEventToDiscord } = require("./organizer.controller");

const createEvent = async (req, res) => {
  try {
    const organizer = await Organizer.findOne({ user: req.user.id });
    if (!organizer) return res.status(404).json({ message: "Organizer profile not found" });

    const event = await Event.create({
      ...req.body,
      organizer: organizer._id,
      status: "DRAFT",
    });

    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const publishEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    event.status = "PUBLISHED";
    await event.save();

    // Notify followers via Discord after publishing
    await postEventToDiscord(event.organizer, {
      name: event.name,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      type: event.type,
      registrationFee: event.registrationFee,
    });

    return res.json({ message: "Event published" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getMyEvents = async (req, res) => {
  try {
    const organizer = await Organizer.findOne({ user: req.user.id });
    if (!organizer) return res.status(404).json({ message: "Organizer profile not found" });

    const events = await Event.find({ organizer: organizer._id }).sort({ createdAt: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllEvents = async (req, res) => {
  try {
    const { search, type, tags, minFee, maxFee, startDateFrom, startDateTo, sortBy, sortOrder, followedOnly } = req.query;

    const filter = { status: "PUBLISHED" };

    // Restrict to organizers followed by this participant
    if (followedOnly === "true" && req.user) {
      const participantProfile = await ParticipantProfile.findOne({ user: req.user.id });
      if (participantProfile?.followedOrganizers?.length > 0) {
        filter.organizer = { $in: participantProfile.followedOrganizers };
      } else {
        return res.json([]);
      }
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (type) filter.type = type.toUpperCase();

    if (tags) {
      filter.tags = { $in: tags.split(",").map((t) => t.trim()) };
    }

    if (minFee !== undefined || maxFee !== undefined) {
      filter.registrationFee = {};
      if (minFee !== undefined) filter.registrationFee.$gte = Number(minFee);
      if (maxFee !== undefined) filter.registrationFee.$lte = Number(maxFee);
    }

    if (startDateFrom || startDateTo) {
      filter.startDate = {};
      if (startDateFrom) filter.startDate.$gte = new Date(startDateFrom);
      if (startDateTo) filter.startDate.$lte = new Date(startDateTo);
    }

    let sort = {};
    if (sortBy) {
      const order = sortOrder === "desc" ? -1 : 1;
      sort[sortBy] = order;
    } else {
      sort.startDate = 1;
    }

    const events = await Event.find(filter).populate("organizer", "name").sort(sort);
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("organizer", "name category contactEmail");
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Track view analytics
    event.viewCount = (event.viewCount || 0) + 1;
    event.lastViewed = new Date();
    await event.save();

    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getTrendingEvents = async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Aggregate registrations in the last 24h, sorted by count
    const recentRegistrations = await Registration.aggregate([
      { $match: { createdAt: { $gte: twentyFourHoursAgo }, status: "REGISTERED" } },
      { $group: { _id: "$event", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const eventIds = recentRegistrations.map((r) => r._id);
    const events = await Event.find({ _id: { $in: eventIds }, status: "PUBLISHED" }).populate("organizer", "name");

    // Attach trending score and preserve aggregate sort order
    const eventsWithScore = events
      .map((event) => ({
        ...event.toObject(),
        trendingScore: recentRegistrations.find((r) => r._id.equals(event._id))?.count || 0,
      }))
      .sort((a, b) => b.trendingScore - a.trendingScore);

    res.json(eventsWithScore);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createEvent, publishEvent, getMyEvents, getAllEvents, getEventById, getTrendingEvents };
