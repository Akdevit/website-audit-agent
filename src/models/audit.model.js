import mongoose from "mongoose";

const auditSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },

    device: {
      type: String,
      enum: ["mobile", "desktop"],
      default: "mobile",
    },

    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed"],
      default: "pending",
      index: true,
    },

    results: {
      lighthouse: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      seo: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      accessibility: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      browser: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      links: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      security: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
    },

    toolErrors: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    report: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    error: {
      type: String,
      default: null,
    },

    durationMs: {
      type: Number,
      default: null,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    minimize: false,
  },
);

auditSchema.index({ createdAt: -1 });

export const Audit = mongoose.model("Audit", auditSchema);