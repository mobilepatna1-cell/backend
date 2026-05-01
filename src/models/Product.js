import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, trim: true },

    category: { type: String, required: true, trim: true, index: true },
    brand: { type: String, trim: true, index: true },
    description: { type: String, default: "" },
    highlights: { type: [String], default: [] },

    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, default: null, min: 0 },
    discountPercentage: { type: Number, default: 0, min: 0 },
    taxPercentage: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "INR" },

    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, required: true, unique: true, trim: true, index: true },
    condition: {
      type: String,
      enum: ["new", "refurbished", "used"],
      default: "new",
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "active",
      index: true,
    },

    // Replaced 'images' array with 4 distinct, optional image fields
    image1: { type: String, trim: true, default: "" },
    image2: { type: String, trim: true, default: "" },
    image3: { type: String, trim: true, default: "" },
    image4: { type: String, trim: true, default: "" },
    
    videos: { type: [String], default: [] },

    warranty: {
      durationMonths: { type: Number, min: 0, default: 0 },
      provider: { type: String, default: "" },
    },
    dimensions: {
      length: { type: Number, min: 0, default: 0 },
      width: { type: Number, min: 0, default: 0 },
      height: { type: Number, min: 0, default: 0 },
      unit: { type: String, default: "cm" },
    },
    weight: {
      value: { type: Number, min: 0, default: 0 },
      unit: { type: String, default: "g" },
    },

    attributes: { type: mongoose.Schema.Types.Mixed, default: {} },

    specifications: [
      {
        label: { type: String, required: true, trim: true },
        value: { type: String, default: "" },
      },
    ],

    variants: [
      {
        name: { type: String, required: true, trim: true },
        options: [
          {
            label: { type: String, required: true, trim: true },
            value: { type: String, default: "" },
            additionalPrice: { type: Number, default: 0, min: 0 },
            additionalStock: { type: Number, default: 0, min: 0 },
            sku: { type: String, default: "" },
          },
        ],
      },
    ],

    ratingsAverage: { type: Number, default: 0, min: 0 },
    ratingsCount: { type: Number, default: 0, min: 0 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

productSchema.index({ category: 1, brand: 1, price: -1 });

export default mongoose.model("Product", productSchema);