const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ParticipantProfile = require("../models/ParticipantProfile");
const { PARTICIPANT } = require("../utils/roles");

const register = async (req, res) => {
  try {
    const { email, password, participantType } = req.body;

    if (participantType === "IIIT" && !email.endsWith("@iiit.ac.in")) {
      return res.status(400).json({ message: "Invalid IIIT email" });
    }

    const user = await User.create({
      email,
      password,
      role: PARTICIPANT,
    });

    await ParticipantProfile.create({
      user: user._id,
      participantType,
    });

    res.status(201).json({ message: "Registered successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

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

module.exports = { register, login };
