const mongoose = require("mongoose");

const organizerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: String,
    description: String,
    contactEmail: String,
    contactNumber: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Organizer", organizerSchema);
