import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        productTitle: String,
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true }, // price at time of order
        total: { type: Number, required: true },
      },
    ],
    shippingAddress: {
      label: String,
      fullAddress: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    billingAddress: {
      label: String,
      fullAddress: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    orderSummary: {
      subtotal: { type: Number, required: true },
      tax: { type: Number, default: 0 },
      shipping: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      total: { type: Number, required: true },
    },
    paymentMethod: {
      type: String,
      enum: ["credit_card", "debit_card", "upi", "net_banking", "cod"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    orderStatus: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled", "returned"],
      default: "pending",
      index: true,
    },
    trackingNumber: String,
    estimatedDelivery: Date,
    actualDelivery: Date,
    notes: String,
    cancelReason: String,
    returnReason: String,
  },
  { timestamps: true }
);

// Generate order number on save
orderSchema.pre("save", async function () {
  if (this.isNew && !this.orderNumber) {
    const count = await mongoose.model("Order").countDocuments();
    this.orderNumber = `ORD-${Date.now()}-${count + 1}`;
  }
});

export default mongoose.model("Order", orderSchema);
