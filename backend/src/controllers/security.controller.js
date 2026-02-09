const SecurityEvent = require("../models/SecurityEvent");
const BlockedIP = require("../models/BlockedIP");

const getSecurityEvents = async (req, res) => {
  try {
    const {eventType, severity,resolved,startDate,endDate,ipAddress, page = 1,limit = 50,} = req.query;
    const filter = {};

    if (eventType) filter.eventType = eventType;
    if (severity) filter.severity = severity;
    if (resolved !== undefined) filter.resolved = resolved === "true";
    if (ipAddress) filter.ipAddress = ipAddress;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const events = await SecurityEvent.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate("userId", "email role")
      .populate("resolvedBy", "email");

    const total = await SecurityEvent.countDocuments(filter);

    res.json({
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get security events error:", error);
    res.status(500).json({ message: "Failed to fetch security events" });
  }
};

const getSecurityStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const eventsByType = await SecurityEvent.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$eventType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const eventsBySeverity = await SecurityEvent.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$severity", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const unresolvedCount = await SecurityEvent.countDocuments({
      resolved: false,
      createdAt: { $gte: startDate },
    });

    const totalEvents = await SecurityEvent.countDocuments({
      createdAt: { $gte: startDate },
    });

    const topIPs = await SecurityEvent.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$ipAddress", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const blockedIPsCount = await BlockedIP.countDocuments();

    const eventsOverTime = await SecurityEvent.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      summary: {
        totalEvents,
        unresolvedCount,
        blockedIPsCount,
      },
      eventsByType,
      eventsBySeverity,
      topIPs,
      eventsOverTime,
    });
  } catch (error) {
    console.error("Get security stats error:", error);
    res.status(500).json({ message: "Failed to fetch security statistics" });
  }
};

const resolveSecurityEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { notes } = req.body;

    const event = await SecurityEvent.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Security event not found" });
    }

    event.resolved = true;
    event.resolvedBy = req.user.id;
    event.resolvedAt = new Date();
    if (notes) event.notes = notes;

    await event.save();

    res.json({ message: "Security event resolved", event });
  } catch (error) {
    console.error("Resolve security event error:", error);
    res.status(500).json({ message: "Failed to resolve security event" });
  }
};

const getBlockedIPs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const blockedIPs = await BlockedIP.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate("blockedBy", "email");

    const total = await BlockedIP.countDocuments();

    res.json({
      blockedIPs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get blocked IPs error:", error);
    res.status(500).json({ message: "Failed to fetch blocked IPs" });
  }
};

const blockIP = async (req, res) => {
  try {
    const { ipAddress, reason, permanent, expiresInHours } = req.body;

    if (!ipAddress || !reason) {
      return res.status(400).json({ 
        message: "IP address and reason are required" 
      });
    }

    const existingBlock = await BlockedIP.findOne({ ipAddress });
    if (existingBlock) {
      return res.status(400).json({ 
        message: "IP address is already blocked" 
      });
    }

    const blockData = {
      ipAddress,
      reason,
      blockedBy: req.user.id,
      permanent: permanent || false,
      autoBlocked: false,
    };

    if (!permanent && expiresInHours) {
      blockData.expiresAt = new Date(
        Date.now() + parseInt(expiresInHours) * 60 * 60 * 1000
      );
    }

    const blockedIP = await BlockedIP.create(blockData);

    await SecurityEvent.create({
      eventType: "IP_BLOCKED",
      ipAddress,
      severity: "HIGH",
      details: {
        reason,
        blockedBy: req.user.email,
        permanent,
        manual: true,
      },
    });

    res.status(201).json({ 
      message: "IP address blocked successfully", 
      blockedIP 
    });
  } catch (error) {
    console.error("Block IP error:", error);
    res.status(500).json({ message: "Failed to block IP address" });
  }
};

const unblockIP = async (req, res) => {
  try {
    const { ipAddress } = req.params;

    const result = await BlockedIP.deleteOne({ ipAddress });

    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        message: "IP address not found in blocked list" 
      });
    }

    await SecurityEvent.create({
      eventType: "IP_BLOCKED",
      ipAddress,
      severity: "LOW",
      resolved: true,
      resolvedBy: req.user.id,
      details: {
        action: "unblocked",
        unblockedBy: req.user.email,
      },
    });

    res.json({ message: "IP address unblocked successfully" });
  } catch (error) {
    console.error("Unblock IP error:", error);
    res.status(500).json({ message: "Failed to unblock IP address" });
  }
};

const deleteOldEvents = async (req, res) => {
  try {
    const { days = 90 } = req.body;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const result = await SecurityEvent.deleteMany({
      createdAt: { $lt: cutoffDate },
      resolved: true,
    });

    res.json({ 
      message: `Deleted ${result.deletedCount} old security events`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Delete old events error:", error);
    res.status(500).json({ message: "Failed to delete old events" });
  }
};

module.exports = {getSecurityEvents,getSecurityStats,resolveSecurityEvent,getBlockedIPs,blockIP,
  unblockIP,deleteOldEvents,};
