const mongoose = require("mongoose");

const blockedIPSchema = new mongoose.Schema(
  {
    ipAddress: {
      type: String,
      required: true,
      unique: true,
    },

    reason: {
      type: String,
      required: true,
    },

    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    expiresAt: {
      type: Date,
    },

    permanent: {
      type: Boolean,
      default: false,
    },

    failedAttempts: {
      type: Number,
      default: 0,
    },

    lastAttemptAt: Date,

    autoBlocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

blockedIPSchema.index({ ipAddress: 1 });
blockedIPSchema.index({ expiresAt: 1 });

module.exports = mongoose.model("BlockedIP", blockedIPSchema);
