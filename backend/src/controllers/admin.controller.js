const User = require("../models/User");
const Organizer = require("../models/Organizer");
const { ORGANIZER } = require("../utils/roles");

const createOrganizer = async (req, res) => {
  try {
    const { email, name, category, description, contactEmail } = req.body;

    if (!email || !name) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const generatedPassword = Math.random().toString(36).slice(-8);

    const user = await User.create({
      email,
      password: generatedPassword,
      role: ORGANIZER,
    });

    await Organizer.create({
      user: user._id,
      name,
      category,
      description,
      contactEmail,
    });

    return res.status(201).json({
      message: "Organizer created successfully",
      credentials: {
        email,
        password: generatedPassword,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { createOrganizer };
