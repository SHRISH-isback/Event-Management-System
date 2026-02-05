const Organizer = require("../models/Organizer");
const User = require("../models/User");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const ParticipantProfile = require("../models/Participant");
const axios = require("axios");

const getProfile = async (req, res) => {
  try {
    const organizer = await Organizer.findOne({ user: req.user.id });
    
    if (!organizer) {
      return res.status(404).json({ message: "Organizer profile not found" });
    }

    const user = await User.findById(req.user.id);
    
    const eventsCreated = await Event.countDocuments({ organizer: organizer._id });
    const followers = await ParticipantProfile.countDocuments({ 
      followedOrganizers: organizer._id 
    });
    
    const events = await Event.find({ organizer: organizer._id }).select('_id');
    const eventIds = events.map(e => e._id);
    const totalRegistrations = await Registration.countDocuments({ 
      event: { $in: eventIds },
      status: "REGISTERED"
    });

    res.json({
      ...organizer.toObject(),
      loginEmail: user.email,
      eventsCreated,
      followers,
      totalRegistrations,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, category, description, contactEmail, contactNumber, discordWebhook } = req.body;
    
    const organizer = await Organizer.findOne({ user: req.user.id });
    
    if (!organizer) {
      return res.status(404).json({ message: "Organizer profile not found" });
    }

    if (name !== undefined) organizer.name = name;
    if (category !== undefined) organizer.category = category;
    if (description !== undefined) organizer.description = description;
    if (contactEmail !== undefined) organizer.contactEmail = contactEmail;
    if (contactNumber !== undefined) organizer.contactNumber = contactNumber;
    if (discordWebhook !== undefined) organizer.discordWebhook = discordWebhook;

    await organizer.save();

    res.json({ message: "Profile updated successfully", organizer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const testWebhook = async (req, res) => {
  try {
    const organizer = await Organizer.findOne({ user: req.user.id });
    
    if (!organizer || !organizer.discordWebhook) {
      return res.status(400).json({ message: "Discord webhook not configured" });
    }

    const message = {
      content: `**Test Message from ${organizer.name}**`,
      embeds: [{
        title: "Discord Integration Active!",
        description: "Your Discord webhook is working correctly. New events will be automatically posted to this channel.",
        color: 5814783,
        timestamp: new Date().toISOString(),
      }]
    };

    await axios.post(organizer.discordWebhook, message);

    res.json({ message: "Test message sent successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to send webhook message: " + err.message });
  }
};

const postEventToDiscord = async (organizerId, eventData) => {
  try {
    const organizer = await Organizer.findById(organizerId);
    
    if (!organizer || !organizer.discordWebhook) {
      return;
    }

    const message = {
      content: `**New Event Published!**`,
      embeds: [{
        title: eventData.name,
        description: eventData.description,
        color: 3447003,
        fields: [
          {
            name: "Start Date",
            value: new Date(eventData.startDate).toLocaleDateString(),
            inline: true
          },
          {
            name: "End Date",
            value: new Date(eventData.endDate).toLocaleDateString(),
            inline: true
          },
          {
            name: "Type",
            value: eventData.type === "MERCH" ? "Merchandise" : "Normal Event",
            inline: true
          },
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: `Organized by ${organizer.name}`
        }
      }]
    };

    if (eventData.registrationFee !== undefined) {
      message.embeds[0].fields.push({
        name: "Fee",
        value: eventData.registrationFee === 0 ? "Free" : `₹${eventData.registrationFee}`,
        inline: true
      });
    }

    await axios.post(organizer.discordWebhook, message);
  } catch (err) {
    console.error("Failed to post to Discord:", err.message);
  }
};

module.exports = { getProfile, updateProfile, testWebhook,postEventToDiscord };
