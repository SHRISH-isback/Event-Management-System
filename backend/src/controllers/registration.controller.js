const Event = require("../models/Event");
const Registration = require("../models/Registration");
const User = require("../models/User");
const Participant = require("../models/Participant");
const crypto = require("crypto");
const { sendRegistrationEmail } = require("../utils/emailService");
const { generateQRCode, createTicketData } = require("../utils/qrCodeService");
const { 
  generateICSFile, 
  generateBatchICSFile,
  generateGoogleCalendarURL,
  generateOutlookCalendarURL 
} = require("../utils/calendarService");

const registerForEvent = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const participantId = req.user.id;
    const { size, color, quantity, formResponses } = req.body;

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

    if (event.type === "NORMAL" && event.customFields && event.customFields.length > 0) {
      const validationErrors = [];
      
      for (const field of event.customFields) {
        const response = formResponses?.[field.label];
        
        if (field.required && (!response || response === "")) {
          validationErrors.push(`${field.label} is required`);
          continue;
        }

        if (field.type === "dropdown" && response) {
          if (!field.options.includes(response)) {
            validationErrors.push(`Invalid value for ${field.label}`);
          }
        }
        
        if (field.type === "checkbox" && response) {
          const selectedOptions = Array.isArray(response) ? response : [response];
          for (const option of selectedOptions) {
            if (!field.options.includes(option)) {
              validationErrors.push(`Invalid option for ${field.label}: ${option}`);
            }
          }
        }
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          message: "Form validation failed", 
          errors: validationErrors 
        });
      }

      if (!event.formLocked) {
        event.formLocked = true;
        await event.save();
      }
    }

    if (event.type === "MERCH") {
      if (!size || !color || !quantity) {
        return res.status(400).json({ 
          message: "Size, color, and quantity are required for merchandise events" 
        });
      }

      if (quantity > event.purchaseLimit) {
        return res.status(400).json({ 
          message: `Maximum purchase limit is ${event.purchaseLimit} items` 
        });
      }

      const variant = event.merchVariants.find(
        v => v.size === size && v.color === color
      );

      if (!variant) {
        return res.status(400).json({ 
          message: "Selected size and color combination is not available" 
        });
      }

      const availableStock = variant.stock - variant.sold;
      if (availableStock < quantity) {
        return res.status(400).json({ 
          message: `Only ${availableStock} items available in stock` 
        });
      }

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

    const registrationData = {
      participant: participantId,
      event: eventId,
      ticketId,
    };

    if (event.type === "MERCH") {
      registrationData.merchDetails = { size, color, quantity };
      registrationData.paymentStatus = "PENDING";
      registrationData.orderSuccessful = false;
    }

    if (event.type === "NORMAL" && formResponses) {
      registrationData.formResponses = formResponses;
    }

    const registration = await Registration.create(registrationData);

    let qrCodeDataUrl = null;
    if (event.type === "NORMAL") {
      try {
        const ticketData = createTicketData(registration, event);
        qrCodeDataUrl = await generateQRCode(ticketData);
      } catch (qrError) {
        // QR code generation failed
      }
    }

    if (event.type === "NORMAL") {
      try {
        const user = await User.findById(participantId);
        const participant = await Participant.findOne({ user: participantId });

        const emailData = {
          participantName: participant?.name || user.email.split("@")[0],
          eventName: event.name,
          eventDate: event.startDate 
            ? new Date(event.startDate).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "TBA",
          eventTime: event.startDate
            ? new Date(event.startDate).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "TBA",
          eventLocation: event.location || "TBA",
          ticketId: registration.ticketId,
          qrCodeDataUrl,
          eventType: event.type,
          merchDetails: registration.merchDetails,
        };

        await sendRegistrationEmail(user.email, emailData);
        console.log(`✅ Registration email sent to: ${user.email}`);
      } catch (emailError) {
        console.error('❌ Failed to send registration email:', emailError.message);
        console.error('Email config check:', {
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT,
          user: process.env.EMAIL_USER,
          hasPassword: !!process.env.EMAIL_PASSWORD
        });
        // Email sending failed but registration continues
      }
    }

    res.status(201).json({
      message: event.type === "MERCH" 
        ? "Order placed successfully. Please upload payment proof to confirm your order." 
        : "Registered successfully",
      ticketId: registration.ticketId,
      registrationId: registration._id,
      merchDetails: registration.merchDetails,
      qrCode: qrCodeDataUrl,
      paymentStatus: event.type === "MERCH" ? "PENDING" : undefined,
      requiresPaymentProof: event.type === "MERCH",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({
      participant: req.user.id,
      status: "REGISTERED",
    })
      .populate("event", "name description startDate endDate organizer type registrationFee")
      .sort({ createdAt: -1 });

    res.json(registrations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getEventRegistrations = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.eventId,
      organizer: req.user.id,
    });

    if (!event) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const registrations = await Registration.find({
      event: req.params.eventId,
      status: "REGISTERED",
    }).populate("participant", "email");

    res.json(registrations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const checkRegistration = async (req, res) => {
  try {
    const registration = await Registration.findOne({
      participant: req.user.id,
      event: req.params.eventId,
      status: "REGISTERED",
    }).populate("event", "name startDate endDate");

    res.json({ 
      isRegistered: !!registration,
      registrationId: registration?._id,
      event: registration?.event
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getRegistrationCount = async (req, res) => {
  try {
    const count = await Registration.countDocuments({
      event: req.params.eventId,
      status: "REGISTERED",
    });

    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const verifyTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const registration = await Registration.findOne({ ticketId })
      .populate("event", "name startDate endDate location type")
      .populate("participant", "email");

    if (!registration) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const response = {
      valid: registration.status === "REGISTERED",
      ticketId: registration.ticketId,
      status: registration.status,
      event: {
        name: registration.event.name,
        startDate: registration.event.startDate,
        endDate: registration.event.endDate,
        location: registration.event.location,
        type: registration.event.type,
      },
      participantEmail: registration.participant.email,
      registrationDate: registration.createdAt,
    };

    if (registration.merchDetails) {
      response.merchDetails = registration.merchDetails;
    }

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const resendConfirmationEmail = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await Registration.findById(registrationId)
      .populate("event")
      .populate("participant");

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (registration.participant._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const user = await User.findById(req.user.id);

    const ticketData = createTicketData(registration, registration.event);
    const qrCodeDataUrl = await generateQRCode(ticketData);

    const participant = await Participant.findOne({ user: req.user.id });

    const emailData = {
      participantName: participant?.name || user.email.split("@")[0],
      eventName: registration.event.name,
      eventDate: registration.event.startDate
        ? new Date(registration.event.startDate).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "TBA",
      eventTime: registration.event.startDate
        ? new Date(registration.event.startDate).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "TBA",
      eventLocation: registration.event.location || "TBA",
      ticketId: registration.ticketId,
      qrCodeDataUrl,
      eventType: registration.event.type,
      merchDetails: registration.merchDetails,
    };

    await sendRegistrationEmail(user.email, emailData);

    res.json({ 
      message: "Confirmation email sent successfully",
      qrCode: qrCodeDataUrl 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const exportToCalendar = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { reminderMinutes = 30 } = req.query;

    if (!registrationId || !registrationId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid registration ID format" });
    }

    const registration = await Registration.findById(registrationId)
      .populate("event")
      .populate("participant");

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (registration.participant._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const icsContent = generateICSFile(
      registration.event, 
      registration, 
      parseInt(reminderMinutes)
    );

    const filename = `${registration.event.name.replace(/[^a-z0-9]/gi, '_')}_${registration.ticketId}.ics`;

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(icsContent);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const exportBatchToCalendar = async (req, res) => {
  try {
    const { registrationIds, reminderMinutes = 30 } = req.body;

    if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
      return res.status(400).json({ message: "Please provide registration IDs" });
    }

    const registrations = await Registration.find({
      _id: { $in: registrationIds },
      participant: req.user.id,
      status: "REGISTERED"
    }).populate("event");

    if (registrations.length === 0) {
      return res.status(404).json({ message: "No valid registrations found" });
    }

    const eventsWithRegistrations = registrations.map(reg => ({
      event: reg.event,
      registration: reg
    }));

    const icsContent = generateBatchICSFile(
      eventsWithRegistrations, 
      parseInt(reminderMinutes)
    );

    const filename = `my_events_${new Date().toISOString().split('T')[0]}.ics`;

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(icsContent);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getCalendarLinks = async (req, res) => {
  try {
    const { registrationId } = req.params;

    if (!registrationId || !registrationId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid registration ID format" });
    }

    const registration = await Registration.findById(registrationId)
      .populate("event")
      .populate("participant");

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (registration.participant._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const googleCalendarURL = generateGoogleCalendarURL(registration.event, registration);
    const outlookCalendarURL = generateOutlookCalendarURL(registration.event, registration);

    res.json({
      googleCalendar: googleCalendarURL,
      outlook: outlookCalendarURL,
      event: {
        name: registration.event.name,
        startDate: registration.event.startDate,
        endDate: registration.event.endDate,
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const uploadPaymentProof = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { paymentProof } = req.body;

    if (!paymentProof) {
      return res.status(400).json({ message: "Payment proof is required" });
    }

    const registration = await Registration.findById(registrationId)
      .populate("event");

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }
    if (registration.participant.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (registration.event.type !== "MERCH") {
      return res.status(400).json({ message: "Not a merchandise order" });
    }
    if (registration.paymentStatus !== "PENDING") {
      return res.status(400).json({ 
        message: `Cannot upload payment proof. Current status: ${registration.paymentStatus}` 
      });
    }

    registration.paymentProof = paymentProof;
    await registration.save();

    res.json({ 
      message: "Payment proof uploaded successfully. Your order is now pending approval.",
      registration: {
        _id: registration._id,
        paymentStatus: registration.paymentStatus,
        paymentProof: registration.paymentProof
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getPendingMerchOrders = async (req, res) => {
  try {
    const organizerId = req.params.organizerId;

    const events = await Event.find({ organizer: organizerId, type: "MERCH" });
    const eventIds = events.map(e => e._id);

    const pendingOrders = await Registration.find({
      event: { $in: eventIds },
      paymentStatus: { $in: ["PENDING", "APPROVED", "REJECTED"] }
    })
      .populate("participant", "email")
      .populate("event", "name registrationFee")
      .populate({
        path: "participant",
        populate: {
          path: "user",
          model: "User",
          select: "email"
        }
      })
      .sort({ createdAt: -1 });

    const ordersWithDetails = await Promise.all(
      pendingOrders.map(async (order) => {
        const participant = await Participant.findOne({ user: order.participant });
        return {
          ...order.toObject(),
          participantDetails: participant
        };
      })
    );

    res.json(ordersWithDetails);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const approvePayment = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await Registration.findById(registrationId)
      .populate("event")
      .populate("participant");

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    const event = registration.event;
    if (event.organizer.toString() !== req.user.organizerId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (registration.paymentStatus !== "PENDING") {
      return res.status(400).json({ 
        message: `Cannot approve. Current status: ${registration.paymentStatus}` 
      });
    }

    if (!registration.paymentProof) {
      return res.status(400).json({ message: "No payment proof uploaded" });
    }

    const variant = event.merchVariants.find(
      v => v.size === registration.merchDetails.size && 
           v.color === registration.merchDetails.color
    );

    if (!variant) {
      return res.status(400).json({ message: "Variant not found" });
    }

    const availableStock = variant.stock - variant.sold;
    if (availableStock < registration.merchDetails.quantity) {
      return res.status(400).json({ 
        message: `Insufficient stock. Only ${availableStock} items available` 
      });
    }

    variant.sold += registration.merchDetails.quantity;
    await event.save();

    registration.paymentStatus = "APPROVED";
    registration.orderSuccessful = true;
    registration.paymentApprovedBy = req.user.id;
    registration.paymentApprovedAt = new Date();
    await registration.save();

    let qrCodeDataUrl = null;
    try {
      const ticketData = createTicketData(registration, event);
      qrCodeDataUrl = await generateQRCode(ticketData);
    } catch (qrError) {
      // QR code generation failed
    }

    try {
      const user = await User.findById(registration.participant._id || registration.participant);
      const participant = await Participant.findOne({ 
        user: registration.participant._id || registration.participant 
      });

      const emailData = {
        participantName: participant?.name || user.email.split("@")[0],
        eventName: event.name,
        eventDate: event.startDate 
          ? new Date(event.startDate).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "TBA",
        eventTime: event.startDate
          ? new Date(event.startDate).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "TBA",
        eventLocation: event.location || "TBA",
        ticketId: registration.ticketId,
        qrCodeDataUrl,
        eventType: event.type,
        merchDetails: registration.merchDetails,
      };

      await sendRegistrationEmail(user.email, emailData);
    } catch (emailError) {
      // Email sending failed
    }

    res.json({ 
      message: "Payment approved successfully. Order is now confirmed.",
      registration: {
        _id: registration._id,
        paymentStatus: registration.paymentStatus,
        orderSuccessful: registration.orderSuccessful,
        qrCode: qrCodeDataUrl
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const rejectPayment = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const registration = await Registration.findById(registrationId)
      .populate("event");

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    const event = registration.event;
    if (event.organizer.toString() !== req.user.organizerId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (registration.paymentStatus !== "PENDING") {
      return res.status(400).json({ 
        message: `Cannot reject. Current status: ${registration.paymentStatus}` 
      });
    }

    registration.paymentStatus = "REJECTED";
    registration.paymentRejectionReason = reason;
    registration.orderSuccessful = false;
    await registration.save();

    res.json({ 
      message: "Payment rejected.",
      registration: {
        _id: registration._id,
        paymentStatus: registration.paymentStatus,
        paymentRejectionReason: registration.paymentRejectionReason
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { 
  registerForEvent, 
  getMyRegistrations, 
  getEventRegistrations,
  checkRegistration,
  getRegistrationCount,
  verifyTicket,
  resendConfirmationEmail,
  exportToCalendar,
  exportBatchToCalendar,
  getCalendarLinks,
  uploadPaymentProof,
  getPendingMerchOrders,
  approvePayment,
  rejectPayment
};
