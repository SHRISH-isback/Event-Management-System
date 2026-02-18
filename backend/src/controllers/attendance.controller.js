const Registration = require("../models/Registration");
const Event = require("../models/Event");
const { verifyTicketData } = require("../utils/qrCodeService");
const { Parser } = require("json2csv");

const scanQRCode = async (req, res) => {
  try {
    const { qrData } = req.body;
    const organizerId = req.user.id;

    if (!qrData) {
      return res.status(400).json({ message: "QR data is required" });
    }

    let ticketData;
    try {
      ticketData = verifyTicketData(qrData);
    } catch (error) {
      return res.status(400).json({ message: "Invalid QR code" });
    }

    const registration = await Registration.findOne({
      ticketId: ticketData.ticketId,
      event: ticketData.eventId,
    }).populate("participant", "name email").populate("event", "name organizer");

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (registration.event.organizer.toString() !== organizerId) {
      return res.status(403).json({ 
        message: "You are not authorized to scan tickets for this event" 
      });
    }

    if (registration.status === "CANCELLED") {
      return res.status(400).json({ 
        message: "This registration has been cancelled",
        registration: {
          ticketId: registration.ticketId,
          participant: registration.participant,
          status: registration.status,
        }
      });
    }

    if (registration.attendance.scanned && !registration.attendance.manualOverride) {
      return res.status(400).json({ 
        message: "Ticket already scanned",
        scannedAt: registration.attendance.scannedAt,
        scanCount: registration.attendance.scanCount,
        registration: {
          ticketId: registration.ticketId,
          participant: registration.participant,
          scannedAt: registration.attendance.scannedAt,
        }
      });
    }

    registration.attendance.scanned = true;
    registration.attendance.scannedAt = new Date();
    registration.attendance.scannedBy = organizerId;
    registration.attendance.scanCount += 1;

    await registration.save();

    return res.status(200).json({
      message: "Attendance marked successfully",
      registration: {
        ticketId: registration.ticketId,
        participant: registration.participant,
        eventName: registration.event.name,
        scannedAt: registration.attendance.scannedAt,
        scanCount: registration.attendance.scanCount,
        merchDetails: registration.merchDetails,
      }
    });

  } catch (error) {
    console.error("Error scanning QR code:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAttendanceDashboard = async (req, res) => {
  try {
    const { eventId } = req.params;
    const organizerId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.organizer.toString() !== organizerId) {
      return res.status(403).json({ 
        message: "You are not authorized to view attendance for this event" 
      });
    }

    const registrations = await Registration.find({
      event: eventId,
      status: "REGISTERED",
    })
    .populate("participant", "name email")
    .populate("attendance.scannedBy", "name email")
    .populate("attendance.overrideBy", "name email")
    .sort({ "attendance.scannedAt": -1 });

    const scannedRegistrations = registrations.filter(r => r.attendance.scanned);
    const notScannedRegistrations = registrations.filter(r => !r.attendance.scanned);

    const stats = {
      total: registrations.length,
      scanned: scannedRegistrations.length,
      notScanned: notScannedRegistrations.length,
      attendanceRate: registrations.length > 0 
        ? ((scannedRegistrations.length / registrations.length) * 100).toFixed(2)
        : 0,
      manualOverrides: registrations.filter(r => r.attendance.manualOverride).length,
    };

    return res.status(200).json({
      stats,
      scannedRegistrations: scannedRegistrations.map(r => ({
        _id: r._id,
        ticketId: r.ticketId,
        participant: r.participant,
        scannedAt: r.attendance.scannedAt,
        scannedBy: r.attendance.scannedBy,
        scanCount: r.attendance.scanCount,
        manualOverride: r.attendance.manualOverride,
        overrideReason: r.attendance.overrideReason,
        overrideBy: r.attendance.overrideBy,
        overrideAt: r.attendance.overrideAt,
        merchDetails: r.merchDetails,
      })),
      notScannedRegistrations: notScannedRegistrations.map(r => ({
        _id: r._id,
        ticketId: r.ticketId,
        participant: r.participant,
        merchDetails: r.merchDetails,
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
    const organizerId = req.user.id;

    if (!action || !["mark", "unmark"].includes(action)) {
      return res.status(400).json({ 
        message: "Action must be either 'mark' or 'unmark'" 
      });
    }

    if (!reason || reason.trim() === "") {
      return res.status(400).json({ 
        message: "Reason is required for manual override" 
      });
    }

    const registration = await Registration.findById(registrationId)
      .populate("participant", "name email")
      .populate("event", "name organizer");

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (registration.event.organizer.toString() !== organizerId) {
      return res.status(403).json({ 
        message: "You are not authorized to modify attendance for this event" 
      });
    }

    if (registration.status === "CANCELLED") {
      return res.status(400).json({ 
        message: "Cannot modify attendance for cancelled registration" 
      });
    }

    if (action === "mark") {
      registration.attendance.scanned = true;
      registration.attendance.scannedAt = new Date();
      registration.attendance.scannedBy = organizerId;
      registration.attendance.scanCount += 1;
      registration.attendance.manualOverride = true;
      registration.attendance.overrideReason = reason;
      registration.attendance.overrideBy = organizerId;
      registration.attendance.overrideAt = new Date();
    } else {
      registration.attendance.scanned = false;
      registration.attendance.scannedAt = null;
      registration.attendance.scannedBy = null;
      registration.attendance.manualOverride = true;
      registration.attendance.overrideReason = reason;
      registration.attendance.overrideBy = organizerId;
      registration.attendance.overrideAt = new Date();
    }

    await registration.save();

    return res.status(200).json({
      message: `Attendance ${action === "mark" ? "marked" : "unmarked"} successfully`,
      registration: {
        ticketId: registration.ticketId,
        participant: registration.participant,
        attendance: registration.attendance,
      }
    });

  } catch (error) {
    console.error("Error in manual attendance override:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const exportAttendanceReport = async (req, res) => {
  try {
    const { eventId } = req.params;
    const organizerId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.organizer.toString() !== organizerId) {
      return res.status(403).json({ 
        message: "You are not authorized to export attendance for this event" 
      });
    }

    const registrations = await Registration.find({
      event: eventId,
      status: "REGISTERED",
    })
    .populate("participant", "name email")
    .populate("attendance.scannedBy", "name email")
    .populate("attendance.overrideBy", "name email")
    .sort({ "attendance.scannedAt": -1 });

    const csvData = registrations.map(r => ({
      "Ticket ID": r.ticketId,
      "Participant Name": r.participant.name || "N/A",
      "Participant Email": r.participant.email,
      "Attendance Status": r.attendance.scanned ? "Present" : "Absent",
      "Scanned At": r.attendance.scannedAt 
        ? new Date(r.attendance.scannedAt).toLocaleString() 
        : "N/A",
      "Scanned By": r.attendance.scannedBy 
        ? r.attendance.scannedBy.email 
        : "N/A",
      "Scan Count": r.attendance.scanCount || 0,
      "Manual Override": r.attendance.manualOverride ? "Yes" : "No",
      "Override Reason": r.attendance.overrideReason || "N/A",
      "Override By": r.attendance.overrideBy 
        ? r.attendance.overrideBy.email 
        : "N/A",
      "Override At": r.attendance.overrideAt 
        ? new Date(r.attendance.overrideAt).toLocaleString() 
        : "N/A",
      "Merch Size": r.merchDetails?.size || "N/A",
      "Merch Color": r.merchDetails?.color || "N/A",
      "Merch Quantity": r.merchDetails?.quantity || "N/A",
      "Registered At": new Date(r.createdAt).toLocaleString(),
    }));

    const parser = new Parser();
    const csv = parser.parse(csvData);

    const filename = `attendance_${event.name.replace(/\s+/g, '_')}_${Date.now()}.csv`;
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
    const organizerId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.organizer.toString() !== organizerId) {
      return res.status(403).json({ 
        message: "You are not authorized to view audit logs for this event" 
      });
    }

    const auditLogs = await Registration.find({
      event: eventId,
      "attendance.manualOverride": true,
    })
    .populate("participant", "name email")
    .populate("attendance.overrideBy", "name email")
    .sort({ "attendance.overrideAt": -1 });

    const logs = auditLogs.map(r => ({
      ticketId: r.ticketId,
      participant: r.participant,
      action: r.attendance.scanned ? "Marked Present" : "Marked Absent",
      reason: r.attendance.overrideReason,
      overrideBy: r.attendance.overrideBy,
      overrideAt: r.attendance.overrideAt,
    }));

    return res.status(200).json({
      total: logs.length,
      logs,
    });

  } catch (error) {
    console.error("Error fetching audit log:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  scanQRCode,
  getAttendanceDashboard,
  manualAttendanceOverride,
  exportAttendanceReport,
  getAttendanceAuditLog,
};
