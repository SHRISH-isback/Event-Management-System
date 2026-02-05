const ParticipantProfile = require("../models/Participant");

const updatePreferences = async (req, res) => {
  try {
    const { interests, followedOrganizers } = req.body;
    
    const profile = await ParticipantProfile.findOne({ user: req.user.id });
    
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    if (interests !== undefined) {
      profile.interests = interests;
    }
    
    if (followedOrganizers !== undefined) {
      profile.followedOrganizers = followedOrganizers;
    }

    await profile.save();

    res.json({ message: "Preferences updated successfully", profile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const profile = await ParticipantProfile.findOne({ user: req.user.id })
      .populate("followedOrganizers", "name category");
    
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const user = await require("../models/User").findById(req.user.id);

    res.json({
      email: user.email,
      ...profile.toObject(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, contactNumber, collegeOrOrg, interests, followedOrganizers } = req.body;
    
    const profile = await ParticipantProfile.findOne({ user: req.user.id });
    
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    if (firstName !== undefined) profile.firstName = firstName;
    if (lastName !== undefined) profile.lastName = lastName;
    if (contactNumber !== undefined) profile.contactNumber = contactNumber;
    if (collegeOrOrg !== undefined) profile.collegeOrOrg = collegeOrOrg;
    if (interests !== undefined) profile.interests = interests;
    if (followedOrganizers !== undefined) profile.followedOrganizers = followedOrganizers;

    await profile.save();

    res.json({ message: "Profile updated successfully", profile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { updatePreferences, getProfile, updateProfile };
