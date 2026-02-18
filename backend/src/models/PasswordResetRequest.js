const mongoose = require("mongoose");

const passwordResetRequestSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organizer",
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    adminComment: {
      type: String,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    processedAt: {
      type: Date,
    },
    newPassword: {
      type: String,
    },
  },
  { timestamps: true }
);

passwordResetRequestSchema.index({ organizer: 1, createdAt: -1 });
passwordResetRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("PasswordResetRequest", passwordResetRequestSchema);
