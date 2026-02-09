const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema({
  size: String,
  color: String,
  stock: {
    type: Number,
    required: true,
    default: 0,
  },
  sold: {
    type: Number,
    default: 0,
  },
});

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: String,

    type: {
      type: String,
      enum: ["NORMAL", "MERCH"],
      required: true,
    },

    eligibility: String,

    registrationDeadline: Date,
    startDate: Date,
    endDate: Date,

    registrationLimit: Number,
    registrationFee: {
      type: Number,
      default: 0,
    },

    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organizer",
      required: true,
    },

    tags: [String],

    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "CLOSED"],
      default: "DRAFT",
    },

    customFields: [
      {
        label: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ["text", "dropdown", "checkbox", "file"],
          required: true,
        },
        required: {
          type: Boolean,
          default: false,
        },
        options: [String],
        order: {
          type: Number,
          default: 0,
        },
      },
    ],
    formLocked: {
      type: Boolean,
      default: false,
    },

    merchVariants: [variantSchema],
    availableSizes: [String],
    availableColors: [String],
    purchaseLimit: {
      type: Number,
      default: 1,
      min: 1,
    },

    viewCount: {
      type: Number,
      default: 0,
    },
    lastViewed: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
