import mongoose from "mongoose";

const heroSectionSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    badge: {
      type: String,
      required: true,
      trim: true,
      example: "Just Launched",
    },
    headline: {
      type: String,
      required: true,
      trim: true,
      example: "iPhone 15 Pro Max\nTitanium Series",
    },
    sub: {
      type: String,
      required: true,
      trim: true,
      example: "A17 Pro chip, 5× telephoto, USB 3 speeds.",
    },
    tag: {
      type: String,
      default: "",
      trim: true,
      example: "Up to ₹15,000 OFF",
    },
    accent: {
      type: String,
      default: "#f97316",
      trim: true,
      example: "#f97316",
    },
    cta: {
      type: String,
      default: "Shop Now",
      trim: true,
    },
    ctaLink: {
      type: String,
      default: "/shop",
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Ensure unique productId per hero section
heroSectionSchema.index({ productId: 1 }, { unique: true });

export default mongoose.model("HeroSection", heroSectionSchema);
