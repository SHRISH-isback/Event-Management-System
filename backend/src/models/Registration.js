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

    merchDetails: {
      size: String,
      color: String,
      quantity: {
        type: Number,
        default: 1,
        min: 1,
      },
    },

    formResponses: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Registration", registrationSchema);
