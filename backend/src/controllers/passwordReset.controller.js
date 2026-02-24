const PasswordResetRequest = require("../models/PasswordResetRequest");
const Organizer = require("../models/Organizer");
const User = require("../models/User");
const bcrypt = require("bcrypt");

const requestPasswordReset = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: "Reason for password reset is required" });
    }

    const organizer = await Organizer.findOne({ user: req.user.id });
    if (!organizer) {
      return res.status(404).json({ message: "Organizer profile not found" });
    }

    const existingRequest = await PasswordResetRequest.findOne({
      organizer: organizer._id,
      status: "PENDING",
    });

    if (existingRequest) {
      return res.status(400).json({ 
        message: "You already have a pending password reset request" 
      });
    }

    const resetRequest = await PasswordResetRequest.create({
      organizer: organizer._id,
      reason: reason.trim(),
    });

    res.status(201).json({
      message: "Password reset request submitted successfully",
      request: resetRequest,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyResetRequests = async (req, res) => {
  try {
    const organizer = await Organizer.findOne({ user: req.user.id });
    if (!organizer) {
      return res.status(404).json({ message: "Organizer profile not found" });
    }

    const requests = await PasswordResetRequest.find({
      organizer: organizer._id,
    })
      .populate("processedBy", "email")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllResetRequests = async (req, res) => {
  try {
    const { status } = req.query;

    const query = {};
    if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      query.status = status;
    }

    const requests = await PasswordResetRequest.find(query)
      .populate({
        path: "organizer",
        populate: { path: "user", select: "email" },
      })
      .populate("processedBy", "email")
      .sort({ createdAt: -1 });

    const requestsWithDetails = requests.map((request) => ({
      _id: request._id,
      clubName: request.organizer.name,
      clubEmail: request.organizer.user.email,
      reason: request.reason,
      status: request.status,
      adminComment: request.adminComment,
      requestedAt: request.createdAt,
      processedAt: request.processedAt,
      processedBy: request.processedBy,
      organizerId: request.organizer._id,
    }));

    res.json(requestsWithDetails);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const approveResetRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminComment } = req.body;

    const resetRequest = await PasswordResetRequest.findById(requestId).populate({
      path: "organizer",
      populate: { path: "user" },
    });

    if (!resetRequest) {
      return res.status(404).json({ message: "Reset request not found" });
    }

    if (resetRequest.status !== "PENDING") {
      return res.status(400).json({ 
        message: "Only pending requests can be approved" 
      });
    }
    const newPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-2).toUpperCase();

    const user = await User.findById(resetRequest.organizer.user._id);
    user.password = newPassword;
    await user.save();

    resetRequest.status = "APPROVED";
    resetRequest.adminComment = adminComment || "";
    resetRequest.processedBy = req.user.id;
    resetRequest.processedAt = new Date();
    resetRequest.newPassword = newPassword; 
    await resetRequest.save();

    res.json({
      message: "Password reset request approved successfully",
      clubName: resetRequest.organizer.name,
      clubEmail: resetRequest.organizer.user.email,
      newPassword: newPassword,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const rejectResetRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminComment } = req.body;

    if (!adminComment || adminComment.trim().length === 0) {
      return res.status(400).json({ 
        message: "Admin comment is required when rejecting a request" 
      });
    }

    const resetRequest = await PasswordResetRequest.findById(requestId).populate({
      path: "organizer",
      populate: { path: "user", select: "email" },
    });

    if (!resetRequest) {
      return res.status(404).json({ message: "Reset request not found" });
    }

    if (resetRequest.status !== "PENDING") {
      return res.status(400).json({ 
        message: "Only pending requests can be rejected" 
      });
    }

    resetRequest.status = "REJECTED";
    resetRequest.adminComment = adminComment.trim();
    resetRequest.processedBy = req.user.id;
    resetRequest.processedAt = new Date();
    await resetRequest.save();

    res.json({
      message: "Password reset request rejected successfully",
      clubName: resetRequest.organizer.name,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getOrganizerResetHistory = async (req, res) => {
  try {
    const { organizerId } = req.params;

    const organizer = await Organizer.findById(organizerId);
    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    const history = await PasswordResetRequest.find({
      organizer: organizerId,
    })
      .populate("processedBy", "email")
      .sort({ createdAt: -1 });

    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {requestPasswordReset,getMyResetRequests,getAllResetRequests,approveResetRequest,rejectResetRequest,getOrganizerResetHistory,};
