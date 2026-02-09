const Event = require("../models/Event");
const Registration = require("../models/Registration");
const User = require("../models/User");
const Participant = require("../models/Participant");
const crypto = require("crypto");
const { sendRegistrationEmail } = require("../utils/emailService");
const { generateQRCode, createTicketData } = require("../utils/qrCodeService");

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

      variant.sold += quantity;
      await event.save();
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
    }

    if (event.type === "NORMAL" && formResponses) {
      registrationData.formResponses = formResponses;
    }

    const registration = await Registration.create(registrationData);

    let qrCodeDataUrl = null;
    try {
      const ticketData = createTicketData(registration, event);
      qrCodeDataUrl = await generateQRCode(ticketData);
    } catch (qrError) {
      console.error("Error generating QR code:", qrError);
    }

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
      console.log(`Confirmation email sent to ${user.email}`);
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
    }

    res.status(201).json({
      message: event.type === "MERCH" ? "Purchase successful" : "Registered successfully",
      ticketId: registration.ticketId,
      merchDetails: registration.merchDetails,
      qrCode: qrCodeDataUrl,
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
      .populate("event", "name description startDate endDate organizer")
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
    });

    res.json({ isRegistered: !!registration });
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

module.exports = { 
  registerForEvent, 
  getMyRegistrations, 
  getEventRegistrations,
  checkRegistration,
  getRegistrationCount,
  verifyTicket,
  resendConfirmationEmail,
};
