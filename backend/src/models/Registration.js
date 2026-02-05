const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    ticketId: {
      type: String,
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ["REGISTERED", "CANCELLED"],
      default: "REGISTERED",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Registration", registrationSchema);
