const ForumMessage = require("../models/ForumMessage");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const Participant = require("../models/Participant");
const Organizer = require("../models/Organizer");
const { ORGANIZER, PARTICIPANT } = require("../utils/roles");
const { 
  emitNewMessage, 
  emitMessageDeleted, 
  emitMessagePinned, 
  emitReactionUpdate 
} = require("../utils/socketService");

const getEventMessages = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 50, parentMessage = null } = req.query;

    const event = await Event.findById(eventId).populate("organizer");
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    let hasAccess = false;
    
    if (req.user.role === ORGANIZER) {
      const organizer = await Organizer.findOne({ user: req.user.id });
      hasAccess = event.organizer._id.toString() === organizer._id.toString();
    } else if (req.user.role === PARTICIPANT) {
      const registration = await Registration.findOne({
        event: eventId,
        participant: req.user.id,
        status: "REGISTERED",
      });
      hasAccess = !!registration;
    }

    if (!hasAccess) {
      return res.status(403).json({ 
        message: "Access denied. You must be registered for this event or be the organizer." 
      });
    }

    const query = {
      event: eventId,
      isDeleted: false,
    };

    if (parentMessage === "null" || !parentMessage) {
      query.parentMessage = null;
    } else {
      query.parentMessage = parentMessage;
    }

    const messages = await ForumMessage.find(query)
      .populate({
        path: "author",
        select: "email role",
      })
      .sort({ isPinned: -1, isAnnouncement: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const messagesWithDetails = await Promise.all(
      messages.map(async (message) => {
        let authorName = message.author.email;
        
        if (message.author.role === PARTICIPANT) {
          const participant = await Participant.findOne({ user: message.author._id });
          if (participant) authorName = participant.name;
        } else if (message.author.role === ORGANIZER) {
          const organizer = await Organizer.findOne({ user: message.author._id });
          if (organizer) authorName = organizer.name;
        }

        const replyCount = await ForumMessage.countDocuments({
          parentMessage: message._id,
          isDeleted: false,
        });

        return {
          ...message.toObject(),
          authorName,
          replyCount,
        };
      })
    );

    const total = await ForumMessage.countDocuments(query);

    res.json({
      messages: messagesWithDetails,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const postMessage = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { content, parentMessage = null } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: "Message content is required" });
    }

    const event = await Event.findById(eventId).populate("organizer");
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    let hasAccess = false;
    
    if (req.user.role === ORGANIZER) {
      const organizer = await Organizer.findOne({ user: req.user.id });
      hasAccess = event.organizer._id.toString() === organizer._id.toString();
    } else if (req.user.role === PARTICIPANT) {
      const registration = await Registration.findOne({
        event: eventId,
        participant: req.user.id,
        status: "REGISTERED",
      });
      hasAccess = !!registration;
    }

    if (!hasAccess) {
      return res.status(403).json({ 
        message: "Access denied. You must be registered for this event or be the organizer." 
      });
    }

    if (parentMessage) {
      const parent = await ForumMessage.findById(parentMessage);
      if (!parent || parent.event.toString() !== eventId) {
        return res.status(404).json({ message: "Parent message not found" });
      }
    }

    const message = await ForumMessage.create({
      event: eventId,
      author: req.user.id,
      content: content.trim(),
      parentMessage,
    });

    const populatedMessage = await ForumMessage.findById(message._id)
      .populate("author", "email role");

    let authorName = populatedMessage.author.email;
    if (req.user.role === PARTICIPANT) {
      const participant = await Participant.findOne({ user: req.user.id });
      if (participant) authorName = participant.name;
    } else if (req.user.role === ORGANIZER) {
      const organizer = await Organizer.findOne({ user: req.user.id });
      if (organizer) authorName = organizer.name;
    }

    res.status(201).json({
      ...populatedMessage.toObject(),
      authorName,
      replyCount: 0,
    });

    emitNewMessage(eventId, {
      ...populatedMessage.toObject(),
      authorName,
      replyCount: 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const postAnnouncement = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: "Announcement content is required" });
    }

    const event = await Event.findById(eventId).populate("organizer");
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const organizer = await Organizer.findOne({ user: req.user.id });
    if (!organizer || event.organizer._id.toString() !== organizer._id.toString()) {
      return res.status(403).json({ message: "Only the event organizer can post announcements" });
    }

    const announcement = await ForumMessage.create({
      event: eventId,
      author: req.user.id,
      content: content.trim(),
      isAnnouncement: true,
      isPinned: true,
    });

    const populatedAnnouncement = await ForumMessage.findById(announcement._id)
      .populate("author", "email role");

    res.status(201).json({
      ...populatedAnnouncement.toObject(),
      authorName: organizer.name,
      replyCount: 0,
    });

    emitNewMessage(eventId, {
      ...populatedAnnouncement.toObject(),
      authorName: organizer.name,
      replyCount: 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await ForumMessage.findById(messageId).populate({
      path: "event",
      populate: { path: "organizer" },
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    let canDelete = message.author.toString() === req.user.id;

    if (!canDelete && req.user.role === ORGANIZER) {
      const organizer = await Organizer.findOne({ user: req.user.id });
      canDelete = message.event.organizer._id.toString() === organizer._id.toString();
    }

    if (!canDelete) {
      return res.status(403).json({ 
        message: "You can only delete your own messages or messages in your events" 
      });
    }

    message.isDeleted = true;
    message.deletedBy = req.user.id;
    await message.save();

    res.json({ message: "Message deleted successfully" });

    emitMessageDeleted(message.event.toString(), messageId);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const togglePinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await ForumMessage.findById(messageId).populate({
      path: "event",
      populate: { path: "organizer" },
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const organizer = await Organizer.findOne({ user: req.user.id });
    if (!organizer || message.event.organizer._id.toString() !== organizer._id.toString()) {
      return res.status(403).json({ message: "Only the event organizer can pin messages" });
    }

    message.isPinned = !message.isPinned;
    await message.save();

    res.json({ 
      message: `Message ${message.isPinned ? "pinned" : "unpinned"} successfully`,
      isPinned: message.isPinned,
    });

    emitMessagePinned(message.event.toString(), messageId, message.isPinned);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ message: "Emoji is required" });
    }

    const message = await ForumMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const event = await Event.findById(message.event).populate("organizer");
    let hasAccess = false;
    
    if (req.user.role === ORGANIZER) {
      const organizer = await Organizer.findOne({ user: req.user.id });
      hasAccess = event.organizer._id.toString() === organizer._id.toString();
    } else if (req.user.role === PARTICIPANT) {
      const registration = await Registration.findOne({
        event: message.event,
        participant: req.user.id,
        status: "REGISTERED",
      });
      hasAccess = !!registration;
    }

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    message.reactions = message.reactions.filter(
      (r) => r.user.toString() !== req.user.id
    );

    message.reactions.push({
      user: req.user.id,
      emoji,
    });

    await message.save();

    res.json({ 
      message: "Reaction added successfully",
      reactions: message.reactions,
    });

    emitReactionUpdate(message.event.toString(), messageId, message.reactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const removeReaction = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await ForumMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    message.reactions = message.reactions.filter(
      (r) => r.user.toString() !== req.user.id
    );

    await message.save();

    res.json({ 
      message: "Reaction removed successfully",
      reactions: message.reactions,
    });

    emitReactionUpdate(message.event.toString(), messageId, message.reactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {getEventMessages,postMessage,postAnnouncement,deleteMessage,togglePinMessage,addReaction,removeReaction,};
