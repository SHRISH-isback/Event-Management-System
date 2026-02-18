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

    paymentProof: {
      type: String,
    },
    
    paymentStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "NOT_REQUIRED"],
      default: "NOT_REQUIRED",
    },
    
    paymentApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    
    paymentApprovedAt: {
      type: Date,
    },
    
    paymentRejectionReason: {
      type: String,
    },
    
    orderSuccessful: {
      type: Boolean,
      default: false,
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

    attendance: {
      scanned: {
        type: Boolean,
        default: false,
      },
      scannedAt: {
        type: Date,
      },
      scannedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      scanCount: {
        type: Number,
        default: 0,
      },
      manualOverride: {
        type: Boolean,
        default: false,
      },
      overrideReason: {
        type: String,
      },
      overrideBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      overrideAt: {
        type: Date,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Registration", registrationSchema);
