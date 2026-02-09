const mongoose = require("mongoose");

const securityEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      enum: [
        "FAILED_LOGIN",
        "RATE_LIMIT_EXCEEDED",
        "CAPTCHA_FAILED",
        "IP_BLOCKED",
        "SUSPICIOUS_ACTIVITY",
        "ACCOUNT_LOCKED"
      ],
      required: true,
    },

    ipAddress: {
      type: String,
      required: true,
    },

    userAgent: String,

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    email: String,

    endpoint: String,

    details: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },

    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },

    resolved: {
      type: Boolean,
      default: false,
    },

    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    resolvedAt: Date,

    notes: String,
  },
  { timestamps: true }
);

securityEventSchema.index({ ipAddress: 1, createdAt: -1 });
securityEventSchema.index({ eventType: 1, createdAt: -1 });
securityEventSchema.index({ resolved: 1 });

module.exports = mongoose.model("SecurityEvent", securityEventSchema);
