const Registration = require("../models/Registration");
const Event = require("../models/Event");
const Participant = require("../models/Participant");
const { verifyTicketData } = require("../utils/qrCodeService");
const { Parser } = require("json2csv");

// Resolve a participant's display name from profile, fallback to email
const resolveDisplayName = (profile, fallback) =>
  profile?.firstName
    ? `${profile.firstName}${profile.lastName ? " " + profile.lastName : ""}`
    : fallback;

const scanQRCode = async (req, res) => {
  try {
    const { qrData } = req.body;
    const organizerId = req.user.organizerId;

    if (!organizerId) return res.status(403).json({ message: "Organizer profile not found" });
    if (!qrData) return res.status(400).json({ message: "QR data is required" });

    let ticketData;
    try {
      ticketData = verifyTicketData(qrData);
    } catch {
      return res.status(400).json({ message: "Invalid QR code" });
    }

    const registration = await Registration.findOne({
      ticketId: ticketData.ticketId,
      event: ticketData.eventId,
    })
      .populate("participant", "email")
      .populate("event", "name organizer type");

    if (!registration) return res.status(404).json({ message: "Registration not found" });

    if (registration.event.organizer.toString() !== organizerId.toString()) {
      return res.status(403).json({ message: "You are not authorized to scan tickets for this event" });
    }

    const participantProfile = await Participant.findOne({ user: registration.participant._id });
    const displayName = resolveDisplayName(participantProfile, registration.participant.email);

    if (registration.status === "CANCELLED") {
      return res.status(400).json({
        message: "This registration has been cancelled",
        registration: {
          ticketId: registration.ticketId,
          participant: { ...registration.participant.toObject(), displayName },
          status: registration.status,
        },
      });
    }

    // Block MERCH orders that haven't been payment-approved
    if (registration.event.type === "MERCH" && registration.paymentStatus !== "APPROVED") {
      const msg = {
        PENDING: "This merchandise order is still pending payment approval. Cannot scan until approved.",
        REJECTED: "This merchandise order's payment was rejected. Cannot scan.",
      };
      return res.status(400).json({
        message: msg[registration.paymentStatus] || "This merchandise order is not approved.",
        paymentStatus: registration.paymentStatus,
        registration: {
          ticketId: registration.ticketId,
          participant: { ...registration.participant.toObject(), displayName },
        },
      });
    }

    if (registration.attendance.scanned && !registration.attendance.manualOverride) {
      return res.status(400).json({
        message: "Ticket already scanned",
        scannedAt: registration.attendance.scannedAt,
        scanCount: registration.attendance.scanCount,
        registration: {
          ticketId: registration.ticketId,
          participant: { ...registration.participant.toObject(), displayName },
          scannedAt: registration.attendance.scannedAt,
        },
      });
    }

    registration.attendance.scanned = true;
    registration.attendance.scannedAt = new Date();
    registration.attendance.scannedBy = req.user.id;
    registration.attendance.scanCount += 1;
    await registration.save();

    return res.status(200).json({
      message:
        registration.event.type === "MERCH"
          ? `Order marked as collected for ${displayName}`
          : "Attendance marked successfully",
      registration: {
        ticketId: registration.ticketId,
        participant: { ...registration.participant.toObject(), displayName },
        eventName: registration.event.name,
        eventType: registration.event.type,
        scannedAt: registration.attendance.scannedAt,
        scanCount: registration.attendance.scanCount,
        merchDetails: registration.merchDetails,
      },
    });
  } catch (error) {
    console.error("Error scanning QR code:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAttendanceDashboard = async (req, res) => {
  try {
    const { eventId } = req.params;
    const organizerId = req.user.organizerId;

    if (!organizerId) return res.status(403).json({ message: "Organizer profile not found" });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.organizer.toString() !== organizerId.toString()) {
      return res.status(403).json({ message: "You are not authorized to view attendance for this event" });
    }

    // For MERCH events, only APPROVED orders are eligible for attendance tracking
    const registrations = await Registration.find({
      event: eventId,
      status: "REGISTERED",
      paymentStatus: event.type === "MERCH" ? "APPROVED" : { $in: ["APPROVED", "NOT_REQUIRED", null] },
    })
      .populate("participant", "email")
      .populate("attendance.scannedBy", "email")
      .populate("attendance.overrideBy", "email")
      .sort({ "attendance.scannedAt": -1 });

    const profiles = await Participant.find({ user: { $in: registrations.map((r) => r.participant._id) } });
    const profileMap = Object.fromEntries(profiles.map((p) => [p.user.toString(), p]));

    const enrichName = (participant) =>
      resolveDisplayName(profileMap[participant._id.toString()], participant.email);

    const scanned = registrations.filter((r) => r.attendance.scanned);
    const notScanned = registrations.filter((r) => !r.attendance.scanned);

    return res.status(200).json({
      eventType: event.type,
      stats: {
        total: registrations.length,
        scanned: scanned.length,
        notScanned: notScanned.length,
        attendanceRate:
          registrations.length > 0 ? ((scanned.length / registrations.length) * 100).toFixed(2) : 0,
        manualOverrides: registrations.filter((r) => r.attendance.manualOverride).length,
      },
      scannedRegistrations: scanned.map((r) => ({
        _id: r._id,
        ticketId: r.ticketId,
        participant: { ...r.participant.toObject(), displayName: enrichName(r.participant) },
        scannedAt: r.attendance.scannedAt,
        scannedBy: r.attendance.scannedBy,
        scanCount: r.attendance.scanCount,
        manualOverride: r.attendance.manualOverride,
        overrideReason: r.attendance.overrideReason,
        overrideBy: r.attendance.overrideBy,
        overrideAt: r.attendance.overrideAt,
        merchDetails: r.merchDetails,
        formResponses: r.formResponses,
      })),
      notScannedRegistrations: notScanned.map((r) => ({
        _id: r._id,
        ticketId: r.ticketId,
        participant: { ...r.participant.toObject(), displayName: enrichName(r.participant) },
        merchDetails: r.merchDetails,
        formResponses: r.formResponses,
      })),
    });
  } catch (error) {
    console.error("Error fetching attendance dashboard:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const manualAttendanceOverride = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { action, reason } = req.body;
    const organizerId = req.user.organizerId;

    if (!organizerId) return res.status(403).json({ message: "Organizer profile not found" });

    if (!action || !["mark", "unmark"].includes(action)) {
      return res.status(400).json({ message: "Action must be either 'mark' or 'unmark'" });
    }

    if (!reason?.trim()) {
      return res.status(400).json({ message: "Reason is required for manual override" });
    }

    const registration = await Registration.findById(registrationId)
      .populate("participant", "email")
      .populate("event", "name organizer type");

    if (!registration) return res.status(404).json({ message: "Registration not found" });

    if (registration.event.organizer.toString() !== organizerId.toString()) {
      return res.status(403).json({ message: "You are not authorized to modify attendance for this event" });
    }

    if (registration.status === "CANCELLED") {
      return res.status(400).json({ message: "Cannot modify attendance for cancelled registration" });
    }

    if (registration.event.type === "MERCH" && registration.paymentStatus !== "APPROVED") {
      return res.status(400).json({
        message: "Cannot mark attendance for a merchandise order that has not been approved.",
        paymentStatus: registration.paymentStatus,
      });
    }

    // Common override metadata
    const overrideMeta = {
      manualOverride: true,
      overrideReason: reason,
      overrideBy: req.user.id,
      overrideAt: new Date(),
    };

    if (action === "mark") {
      Object.assign(registration.attendance, {
        scanned: true,
        scannedAt: new Date(),
        scannedBy: req.user.id,
        scanCount: registration.attendance.scanCount + 1,
        ...overrideMeta,
      });
    } else {
      Object.assign(registration.attendance, {
        scanned: false,
        scannedAt: null,
        scannedBy: null,
        ...overrideMeta,
      });
    }

    await registration.save();

    return res.status(200).json({
      message: `Attendance ${action === "mark" ? "marked" : "unmarked"} successfully`,
      registration: {
        ticketId: registration.ticketId,
        participant: registration.participant,
        attendance: registration.attendance,
      },
    });
  } catch (error) {
    console.error("Error in manual attendance override:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const exportAttendanceReport = async (req, res) => {
  try {
    const { eventId } = req.params;
    const organizerId = req.user.organizerId;

    if (!organizerId) return res.status(403).json({ message: "Organizer profile not found" });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.organizer.toString() !== organizerId.toString()) {
      return res.status(403).json({ message: "You are not authorized to export attendance for this event" });
    }

    const registrations = await Registration.find({
      event: eventId,
      status: "REGISTERED",
      paymentStatus: event.type === "MERCH" ? "APPROVED" : { $in: ["APPROVED", "NOT_REQUIRED", null] },
    })
      .populate("participant", "email")
      .populate("attendance.scannedBy", "email")
      .populate("attendance.overrideBy", "email")
      .sort({ "attendance.scannedAt": -1 });

    const profiles = await Participant.find({ user: { $in: registrations.map((r) => r.participant._id) } });
    const profileMap = Object.fromEntries(profiles.map((p) => [p.user.toString(), p]));

    const csvData = registrations.map((r) => {
      const displayName = resolveDisplayName(profileMap[r.participant._id.toString()], "N/A");
      return {
        "Ticket ID": r.ticketId,
        "Participant Name": displayName,
        "Participant Email": r.participant.email,
        "Attendance Status": r.attendance.scanned ? "Present" : "Absent",
        "Scanned At": r.attendance.scannedAt ? new Date(r.attendance.scannedAt).toLocaleString() : "N/A",
        "Scanned By": r.attendance.scannedBy?.email || "N/A",
        "Scan Count": r.attendance.scanCount || 0,
        "Manual Override": r.attendance.manualOverride ? "Yes" : "No",
        "Override Reason": r.attendance.overrideReason || "N/A",
        "Override By": r.attendance.overrideBy?.email || "N/A",
        "Override At": r.attendance.overrideAt ? new Date(r.attendance.overrideAt).toLocaleString() : "N/A",
        "Merch Size": r.merchDetails?.size || "N/A",
        "Merch Color": r.merchDetails?.color || "N/A",
        "Merch Quantity": r.merchDetails?.quantity || "N/A",
        "Registered At": new Date(r.createdAt).toLocaleString(),
      };
    });

    const csv = new Parser().parse(csvData);
    const filename = `attendance_${event.name.replace(/\s+/g, "_")}_${Date.now()}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(csv);
  } catch (error) {
    console.error("Error exporting attendance report:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAttendanceAuditLog = async (req, res) => {
  try {
    const { eventId } = req.params;
    const organizerId = req.user.organizerId;

    if (!organizerId) return res.status(403).json({ message: "Organizer profile not found" });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.organizer.toString() !== organizerId.toString()) {
      return res.status(403).json({ message: "You are not authorized to view audit logs for this event" });
    }

    // Only fetch registrations that were manually overridden
    const auditLogs = await Registration.find({ event: eventId, "attendance.manualOverride": true })
      .populate("participant", "email")
      .populate("attendance.overrideBy", "email")
      .sort({ "attendance.overrideAt": -1 });

    const profiles = await Participant.find({ user: { $in: auditLogs.map((r) => r.participant._id) } });
    const profileMap = Object.fromEntries(profiles.map((p) => [p.user.toString(), p]));

    const logs = auditLogs.map((r) => ({
      ticketId: r.ticketId,
      participant: {
        ...r.participant.toObject(),
        displayName: resolveDisplayName(profileMap[r.participant._id.toString()], r.participant.email),
      },
      action: r.attendance.scanned ? "Marked Present" : "Marked Absent",
      reason: r.attendance.overrideReason,
      overrideBy: r.attendance.overrideBy,
      overrideAt: r.attendance.overrideAt,
    }));

    return res.status(200).json({ total: logs.length, logs });
  } catch (error) {
    console.error("Error fetching audit log:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {scanQRCode,getAttendanceDashboard,manualAttendanceOverride,exportAttendanceReport,getAttendanceAuditLog,};
