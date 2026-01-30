const mongoose = require("mongoose");

const participantProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    firstName: String,
    lastName: String,
    participantType: {
      type: String,
      enum: ["IIIT", "NON_IIIT"],
      required: true,
    },
    collegeOrOrg: String,
    contactNumber: String,
    interests: [String],
    followedOrganizers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organizer",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "ParticipantProfile",
  participantProfileSchema
);
