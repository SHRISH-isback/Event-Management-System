const Event = require("../models/Event");
const Registration = require("../models/Registration");
const User = require("../models/User");
const Participant = require("../models/Participant");
const Organizer = require("../models/Organizer");
const crypto = require("crypto");
const { sendRegistrationEmail, sendPaymentApprovalEmail, sendPaymentRejectionEmail } = require("../utils/emailService");

const { generateQRCode, createTicketData } = require("../utils/qrCodeService");
const { generateICSFile, generateBatchICSFile,generateGoogleCalendarURL,generateOutlookCalendarURL } = require("../utils/calendarService");

const registerForEvent = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const participantId = req.user.id;
    const { size, color, quantity, formResponses } = req.body;

    const event = await Event.findById(eventId);
    if (!event || event.status !== "PUBLISHED") {
      return res.status(400).json({ message: "Event not available" });
    }

    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return res.status(400).json({ message: "Registration closed" });
    }

    const alreadyRegistered = await Registration.findOne({ participant: participantId, event: eventId });
    if (alreadyRegistered) {
      return res.status(400).json({ message: "Already registered" });
    }

    if (event.type === "MERCH") {
      if (!size || !color || !quantity) {
        return res.status(400).json({ message: "Size, color, and quantity are required for merchandise orders" });
      }
      if (quantity > event.purchaseLimit) {
        return res.status(400).json({ message: `Maximum purchase limit is ${event.purchaseLimit} items` });
      }
      const variant = event.merchVariants.find(v => v.size === size && v.color === color);
      if (!variant) {
        return res.status(400).json({ message: "Selected size and color combination is not available" });
      }
      const availableStock = variant.stock - variant.sold;
      if (availableStock < quantity) {
        return res.status(400).json({ message: `Only ${availableStock} items available in stock` });
      }
    }

    if (event.type === "NORMAL" && event.customFields && event.customFields.length > 0) {
      const validationErrors = [];
      for (const field of event.customFields) {
        const response = formResponses?.[field.label];
        if (field.required && (!response || response === "")) {
          validationErrors.push(`${field.label} is required`);
          continue;
        }
        if (field.type === "dropdown" && response && !field.options.includes(response)) {
          validationErrors.push(`Invalid value for ${field.label}`);
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
        return res.status(400).json({ message: "Form validation failed", errors: validationErrors });
      }
      if (!event.formLocked) {
        event.formLocked = true;
        await event.save();
      }
    }

    if (event.registrationLimit) {
      const count = await Registration.countDocuments({ event: eventId, status: "REGISTERED" });
      if (count >= event.registrationLimit) {
        return res.status(400).json({ message: "Event is full" });
      }
    }

    const ticketId = crypto.randomBytes(6).toString("hex");
    const registrationData = { participant: participantId, event: eventId, ticketId };

    if (event.type === "MERCH") {
      registrationData.merchDetails = { size, color, quantity };
      registrationData.paymentStatus = "PENDING";
      registrationData.orderSuccessful = false;
    }

    if (event.type === "NORMAL" && formResponses) {
      registrationData.formResponses = formResponses;
    }

    if (event.type === "NORMAL" && event.registrationFee > 0) {
      registrationData.paymentStatus = "PENDING";
    }

    const registration = await Registration.create(registrationData);
    if (event.type === "NORMAL" && event.registrationFee > 0) {
      return res.status(201).json({
        message: "Registration submitted. Please upload your payment proof to complete booking.",
        ticketId: registration.ticketId,
        registrationId: registration._id,
        paymentStatus: "PENDING",
        requiresPaymentProof: true,
      });
    }

    if (event.type === "NORMAL") {
      let qrCodeDataUrl = null;
      try {
        const ticketData = createTicketData(registration, event);
        qrCodeDataUrl = await generateQRCode(ticketData);
      } catch (qrError) {
        console.error("Failed to generate QR code:", qrError);
      }

      try {
        const user = await User.findById(participantId);
        const participant = await Participant.findOne({ user: participantId });
        const participantName = (participant?.firstName && participant?.lastName)
          ? `${participant.firstName} ${participant.lastName}`
          : participant?.firstName || user.email.split("@")[0];

        if (qrCodeDataUrl) {
          await sendRegistrationEmail(user.email, {
            participantName,
            eventName: event.name,
            eventDate: event.startDate
              ? new Date(event.startDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
              : "TBA",
            eventTime: event.startDate
              ? new Date(event.startDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
              : "TBA",
            eventLocation: event.location || "TBA",
            ticketId: registration.ticketId,
            qrCodeDataUrl,
            eventType: event.type,
          });
          console.log(`Registration email sent to: ${user.email}`);
        }
      } catch (emailError) {
        console.error("Failed to send registration email:", emailError.message);
      }

      return res.status(201).json({
        message: "Registered successfully",
        ticketId: registration.ticketId,
        registrationId: registration._id,
        qrCode: qrCodeDataUrl,
      });
    }

    res.status(201).json({
      message: "Order submitted. Awaiting organizer payment approval.",
      ticketId: registration.ticketId,
      registrationId: registration._id,
      paymentStatus: "PENDING",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getMyRegistrations = async (req, res) => {
  try {
    console.log('Fetching registrations for user:', req.user.id);
    console.log('User role:', req.user.role);
    
    const registrations = await Registration.find({
      participant: req.user.id,
      status: "REGISTERED",
    })
      .populate("event", "name description startDate endDate organizer type registrationFee merchVariants availableSizes availableColors purchaseLimit")
      .sort({ createdAt: -1 });

    const registrationsWithDetails = registrations.map(reg => reg.toObject());
    console.log(`Found ${registrations.length} registrations`);
    res.json(registrationsWithDetails);
  } catch (err) {
    console.error('Error fetching registrations:', err);
    res.status(500).json({ message: err.message });
  }
};
const getEventRegistrations = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      let organizerId = req.user.organizerId;
      if (!organizerId) {
        const organizer = await Organizer.findOne({ user: req.user.id });
        if (!organizer) {
          return res.status(403).json({ message: "Not authorized: organizer profile not found" });
        }
        organizerId = organizer._id;
      }

      const event = await Event.findOne({
        _id: req.params.eventId,
        organizer: organizerId,
      });

      if (!event) {
        return res.status(403).json({ message: "Not authorized" });
      }
    } else {
      const event = await Event.findById(req.params.eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
    }

    const registrations = await Registration.find({
      event: req.params.eventId,
      status: "REGISTERED",
    }).populate("participant", "email").sort({ createdAt: -1 });

    const userIds = registrations.map(r => r.participant._id);
    const profiles = await Participant.find({ user: { $in: userIds } });
    const profileMap = {};
    profiles.forEach(p => { profileMap[p.user.toString()] = p; });

    const enriched = registrations.map(r => {
      const obj = r.toObject();
      const profile = profileMap[r.participant._id.toString()];
      obj.participant.displayName = profile?.firstName
        ? `${profile.firstName}${profile.lastName ? ' ' + profile.lastName : ''}`
        : r.participant.email;
      obj.participant.participantType = profile?.participantType;
      obj.participant.contactNumber = profile?.contactNumber;
      return obj;
    });

    res.json(enriched);
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
      paymentStatus: registration?.paymentStatus,
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
      valid: registration.status === "REGISTERED" &&
             (registration.event.type !== "MERCH" || registration.paymentStatus === "APPROVED"),
      ticketId: registration.ticketId,
      status: registration.status,
      paymentStatus: registration.paymentStatus,
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

    console.log('Resending confirmation for registration:', registrationId);

    const registration = await Registration.findById(registrationId)
      .populate("event")
      .populate("participant");

    if (!registration) {
      console.log('Registration not found');
      return res.status(404).json({ message: "Registration not found" });
    }

    if (registration.participant._id.toString() !== req.user.id) {
      console.log('Not authorized - user mismatch');
      return res.status(403).json({ message: "Not authorized" });
    }

    console.log('Event type:', registration.event.type);
    console.log('Has merch details:', !!registration.merchDetails);
    console.log('Payment status:', registration.paymentStatus);

    // Block QR code for any registration (MERCH or paid NORMAL) where payment isn't approved
    const requiresPaymentApproval =
      registration.event.type === "MERCH" ||
      (registration.event.type === "NORMAL" && registration.event.registrationFee > 0 && registration.paymentStatus && registration.paymentStatus !== "NOT_REQUIRED");

    if (requiresPaymentApproval && registration.paymentStatus !== "APPROVED") {
      const statusMsg = {
        PENDING: registration.paymentProof
          ? "Your payment proof is awaiting organizer approval. QR code will be available once approved."
          : "Please upload your payment proof first. QR code will be available once payment is approved.",
        REJECTED: "Your payment was rejected. QR code is not available. Please re-upload a valid payment proof.",
      };
      return res.status(403).json({
        message: statusMsg[registration.paymentStatus] || "QR code is not available for this order.",
        paymentStatus: registration.paymentStatus,
      });
    }

    const user = await User.findById(req.user.id);
    let qrCodeDataUrl = null;

    try {
      const ticketData = createTicketData(registration, registration.event);
      qrCodeDataUrl = await generateQRCode(ticketData);
      console.log('QR code generated successfully');
    } catch (qrError) {
      console.error('Failed to generate QR code:', qrError);
      return res.status(500).json({ 
        message: "Failed to generate QR code" 
      });
    }

    const participant = await Participant.findOne({ user: req.user.id });

    const emailData = {
      participantName: participant?.firstName 
        ? `${participant.firstName} ${participant.lastName}` 
        : user.email.split("@")[0],
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

    try {
      await sendRegistrationEmail(user.email, emailData);
      console.log('Confirmation email sent');
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
    }

    res.json({ 
      message: "QR code retrieved successfully",
      qrCode: qrCodeDataUrl 
    });
  } catch (err) {
    console.error('Error in resendConfirmationEmail:', err);
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
    // Allow payment proof for MERCH and paid NORMAL events
    const requiresPayment =
      registration.event.type === "MERCH" ||
      (registration.event.type === "NORMAL" && registration.event.registrationFee > 0);
    if (!requiresPayment) {
      return res.status(400).json({ message: "This registration does not require payment proof" });
    }
    if (!["PENDING", "REJECTED"].includes(registration.paymentStatus)) {
      return res.status(400).json({ 
        message: `Cannot upload payment proof. Current status: ${registration.paymentStatus}` 
      });
    }

    registration.paymentProof = paymentProof;
    if (registration.paymentStatus === "REJECTED") {
      registration.paymentStatus = "PENDING";
      registration.paymentRejectionReason = undefined;
    }
    await registration.save();

    res.json({
      message: "Payment proof uploaded. Awaiting organizer approval.",
      registration: {
        _id: registration._id,
        paymentStatus: registration.paymentStatus,
        paymentProof: registration.paymentProof,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getPendingMerchOrders = async (req, res) => {
  try {
    const organizerId = req.params.organizerId;

    if (req.user.organizerId && req.user.organizerId.toString() !== organizerId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const events = await Event.find({ organizer: organizerId, type: "MERCH" });
    const eventIds = events.map(e => e._id);

    const pendingOrders = await Registration.find({
      event: { $in: eventIds },
      status: "REGISTERED",
      paymentStatus: { $in: ["PENDING", "APPROVED", "REJECTED"] }
    })
      .populate("participant", "email")
      .populate("event", "name registrationFee")
      .sort({ createdAt: -1 });

    const ordersWithDetails = await Promise.all(
      pendingOrders.map(async (order) => {
        const participant = await Participant.findOne({ user: order.participant._id });
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

// Fetch all payment-pending registrations across both NORMAL (paid) and MERCH events
// for the given organizer — used by the unified Payment Verification dashboard
const getPendingPaymentOrders = async (req, res) => {
  try {
    const organizerId = req.params.organizerId;

    if (req.user.organizerId && req.user.organizerId.toString() !== organizerId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Fetch all events for this organizer
    const events = await Event.find({ organizer: organizerId });
    const eventIds = events.map(e => e._id);

    // Find registrations that have a non-trivial paymentStatus
    const orders = await Registration.find({
      event: { $in: eventIds },
      status: "REGISTERED",
      paymentStatus: { $in: ["PENDING", "APPROVED", "REJECTED"] }
    })
      .populate("participant", "email")
      .populate("event", "name registrationFee type")
      .sort({ createdAt: -1 });

    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const participant = await Participant.findOne({ user: order.participant._id });
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

    const organizerId = req.user.organizerId;
    if (!organizerId || event.organizer.toString() !== organizerId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (registration.paymentStatus !== "PENDING") {
      return res.status(400).json({ 
        message: `Cannot approve. Current status: ${registration.paymentStatus}` 
      });
    }

    if (!registration.paymentProof) {
      return res.status(400).json({ message: "No payment proof uploaded yet" });
    }

    registration.paymentStatus = "APPROVED";
    registration.orderSuccessful = true;
    registration.paymentApprovedBy = req.user.id;
    registration.paymentApprovedAt = new Date();

    // Decrement stock on approval (MERCH only)
    if (event.type === "MERCH" && registration.merchDetails) {
      const variant = event.merchVariants.find(
        v => v.size === registration.merchDetails.size &&
             v.color === registration.merchDetails.color
      );
      if (variant && registration.merchDetails?.quantity) {
        const availableStock = variant.stock - variant.sold;
        if (availableStock < registration.merchDetails.quantity) {
          return res.status(400).json({ 
            message: `Cannot approve: only ${availableStock} items are now available in stock.` 
          });
        }
        variant.sold += registration.merchDetails.quantity;
        await event.save();
      }
    }

    await registration.save();

    let qrCodeDataUrl = null;
    try {
      const ticketData = createTicketData(registration, event);
      qrCodeDataUrl = await generateQRCode(ticketData);
      console.log('QR code generated for approved merch order');
    } catch (qrError) {
      console.error('QR code generation failed:', qrError);
    }

    try {
      const user = await User.findById(registration.participant._id || registration.participant);
      const participant = await Participant.findOne({ 
        user: registration.participant._id || registration.participant 
      });

      const participantName = (participant?.firstName && participant?.lastName)
        ? `${participant.firstName} ${participant.lastName}`
        : participant?.firstName || user.email.split("@")[0];

      if (event.type === "NORMAL") {
        await sendRegistrationEmail(user.email, {
          participantName,
          eventName: event.name,
          eventDate: event.startDate
            ? new Date(event.startDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
            : "TBA",
          eventTime: event.startDate
            ? new Date(event.startDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
            : "TBA",
          eventLocation: event.location || "TBA",
          ticketId: registration.ticketId,
          qrCodeDataUrl,
          eventType: "NORMAL",
        });
      } else {
        await sendPaymentApprovalEmail(user.email, {
          participantName,
          eventName: event.name,
          ticketId: registration.ticketId,
          qrCodeDataUrl,
          merchDetails: registration.merchDetails,
          registrationFee: event.registrationFee,
        });
      }
      console.log('Payment approval email sent');
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError.message);
    }

    res.json({ 
      message: event.type === "NORMAL"
        ? "Payment approved. Registration is now confirmed."
        : "Payment approved successfully. Order is now confirmed.",
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

    const organizerId = req.user.organizerId;
    if (!organizerId || event.organizer.toString() !== organizerId.toString()) {
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

    try {
      await registration.populate("participant");
      const user = await User.findById(registration.participant._id || registration.participant);
      const participant = await Participant.findOne({ 
        user: registration.participant._id || registration.participant 
      });

      await sendPaymentRejectionEmail(user.email, {
        participantName: (participant?.firstName && participant?.lastName)
          ? `${participant.firstName} ${participant.lastName}`
          : participant?.firstName || user.email.split("@")[0],
        eventName: event.name,
        ticketId: registration.ticketId,
        reason,
        merchDetails: registration.merchDetails,
      });
      console.log('Payment rejection email sent');
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError.message);
    }

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

module.exports = { registerForEvent, getMyRegistrations, getEventRegistrations,checkRegistration,
  getRegistrationCount,
  verifyTicket,
  resendConfirmationEmail,
  exportToCalendar,
  exportBatchToCalendar,
  getCalendarLinks,
  uploadPaymentProof,
  getPendingMerchOrders,
  getPendingPaymentOrders,
  approvePayment,
  rejectPayment,
};
