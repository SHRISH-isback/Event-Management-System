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

const updateEvent = async (req, res) => {
  try {
    const organizer = await Organizer.findOne({ user: req.user.id });
    if (!organizer) return res.status(404).json({ message: "Organizer profile not found" });

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (!event.organizer.equals(organizer._id)) return res.status(403).json({ message: "Not authorized to edit this event" });

    const { status } = req.body;

    if (event.status === "DRAFT") {
      // DRAFT: allow editing all fields
      const allowedFields = ["name", "description", "startDate", "endDate", "registrationDeadline",
        "registrationLimit", "registrationFee", "eligibility", "tags", "customFields",
        "availableSizes", "availableColors", "merchVariants", "purchaseLimit", "status"];
      allowedFields.forEach(f => { if (req.body[f] !== undefined) event[f] = req.body[f]; });
    } else if (event.status === "PUBLISHED") {
      // PUBLISHED: only allow extending deadline/limit and editing description; also allow marking ONGOING
      const allowed = ["description", "registrationDeadline", "registrationLimit", "status"];
      allowed.forEach(f => { if (req.body[f] !== undefined) event[f] = req.body[f]; });
      // Enforce: deadline can only be extended, limit can only be increased
      if (req.body.registrationDeadline && new Date(req.body.registrationDeadline) < new Date(event.registrationDeadline)) {
        return res.status(400).json({ message: "Cannot shorten registration deadline after publishing" });
      }
      if (req.body.registrationLimit && Number(req.body.registrationLimit) < (event.registrationLimit || 0)) {
        return res.status(400).json({ message: "Cannot reduce registration limit after publishing" });
      }
    } else if (event.status === "ONGOING") {
      // ONGOING: only allow marking COMPLETED
      if (status && status === "COMPLETED") event.status = "COMPLETED";
      else return res.status(400).json({ message: "Only status change to COMPLETED allowed for ongoing events" });
    } else {
      return res.status(400).json({ message: "Completed or closed events cannot be edited" });
    }

    if (status && event.status === "DRAFT" && status === "ONGOING") {
      event.status = "ONGOING";
    }

    await event.save();
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyOngoingEvents = async (req, res) => {
  try {
    const organizer = await Organizer.findOne({ user: req.user.id });
    if (!organizer) return res.status(404).json({ message: "Organizer profile not found" });

    const now = new Date();
    const events = await Event.find({
      organizer: organizer._id,
      $or: [
        { status: "ONGOING" },
        { status: "PUBLISHED", startDate: { $lte: now }, endDate: { $gte: now } },
      ],
    }).sort({ startDate: 1 });

    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getEventAnalytics = async (req, res) => {
  try {
    const organizer = await Organizer.findOne({ user: req.user.id });
    if (!organizer) return res.status(404).json({ message: "Organizer profile not found" });

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (!event.organizer.equals(organizer._id)) return res.status(403).json({ message: "Not authorized" });

    const registrations = await Registration.find({ event: event._id });

    const totalRegistrations = registrations.length;
    const attended = registrations.filter(r => r.attendance?.scanned).length;
    const revenue = registrations
      .filter(r => r.paymentStatus === "APPROVED" || r.paymentStatus === "NOT_REQUIRED")
      .length * (event.registrationFee || 0);

    // Registration timeline — last 7 days
    const timeline = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - i);
      const next = new Date(day);
      next.setDate(next.getDate() + 1);
      const count = registrations.filter(r => {
        const d = new Date(r.createdAt);
        return d >= day && d < next;
      }).length;
      timeline.push({ date: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }), count });
    }

    const statusBreakdown = registrations.reduce((acc, r) => {
      acc[r.paymentStatus || "NOT_REQUIRED"] = (acc[r.paymentStatus || "NOT_REQUIRED"] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalRegistrations,
      attended,
      attendanceRate: totalRegistrations > 0 ? ((attended / totalRegistrations) * 100).toFixed(1) : 0,
      revenue,
      timeline,
      statusBreakdown,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createEvent, publishEvent, updateEvent, getMyEvents, getMyOngoingEvents, getAllEvents, getEventById, getTrendingEvents, getEventAnalytics };
