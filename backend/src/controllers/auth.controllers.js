const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ParticipantProfile = require("../models/Participant");
const { PARTICIPANT } = require("../utils/roles");

const register = async (req, res) => {
  try {
    const { email, password, participantType, firstName, lastName, contactNumber, collegeOrOrg } = req.body;
    
    if (!email || !password || !participantType || !firstName || !lastName || !contactNumber) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    if (participantType === "NON_IIIT" && !collegeOrOrg) {
      return res.status(400).json({ message: "Organization name is required for external participants" });
    }
    
    if (participantType === "IIIT" && !email.endsWith("@iiit.ac.in") && !email.endsWith("@research.iiit.ac.in")) {
      return res.status(400).json({ message: "IIIT participants must use @iiit.ac.in or @research.iiit.ac.in email" });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    
    const user = await User.create({
      email,
      password,
      role: PARTICIPANT,
    });

    await ParticipantProfile.create({
      user: user._id,
      participantType,
      firstName,
      lastName,
      contactNumber,
      collegeOrOrg: participantType === "IIIT" ? "IIIT Hyderabad" : collegeOrOrg,
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ 
      message: "Registered successfully",
      token,
      role: user.role
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, role: user.role });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user.id);
    
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login, changePassword };
