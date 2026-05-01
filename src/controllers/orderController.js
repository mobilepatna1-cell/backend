import mongoose from "mongoose";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";

// Get all orders (Admin only)
export const getAllOrders = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "20", 10), 1),
      100
    );
    const status = req.query.status; // pending, confirmed, shipped, delivered, etc.
    const search = req.query.search; // search by order number or user email

    const filter = {};
    if (status) filter.orderStatus = status;

    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      filter.$or = [{ orderNumber: searchRegex }];
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate("user", "name email number")
      .populate("items.product", "title price")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      data: orders,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Fetch failed" });
  }
};

// Get order by ID (User can view own, Admin can view any)
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid order id" });
    }

    const order = await Order.findById(id)
      .populate("user", "name email number")
      .populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check permission: user can only view own orders, admin can view any
    if (
      userRole !== "admin" &&
      order.user._id.toString() !== userId
    ) {
      return res.status(403).json({
        message: "You do not have permission to view this order",
      });
    }

    return res.status(200).json({ order });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Fetch failed" });
  }
};

// Get user's orders (User can view their own orders)
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "20", 10), 1),
      100
    );
    const status = req.query.status;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const filter = { user: userId };
    if (status) filter.orderStatus = status;

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate("user", "name email number")
      .populate("items.product", "title price")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      data: orders,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Fetch failed" });
  }
};

// Create order (User)
export const createOrder = async (req, res) => {
  try {
    const userId = req.user?.id;
    const {
      items,
      shippingAddress,
      billingAddress,
      orderSummary,
      paymentMethod,
    } = req.body;

    if (!items || !items.length || !shippingAddress || !orderSummary) {
      return res.status(400).json({
        message:
          "items, shippingAddress, and orderSummary are required",
      });
    }

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create order
    const order = await Order.create({
      user: userId,
      items,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      orderSummary,
      paymentMethod: paymentMethod || "cod",
      orderStatus: "pending",
      paymentStatus: "pending",
    });

    return res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Create failed" });
  }
};

// Update order status (Admin only)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus, trackingNumber } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid order id" });
    }

    const updateData = {};
    if (orderStatus) updateData.orderStatus = orderStatus;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (trackingNumber) updateData.trackingNumber = trackingNumber;

    const order = await Order.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("user", "name email number");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({
      message: "Order updated successfully",
      order,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Update failed" });
  }
};

// Cancel order (User can cancel if pending, Admin can cancel any)
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancelReason } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid order id" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check permission
    if (
      userRole !== "admin" &&
      order.user.toString() !== userId
    ) {
      return res.status(403).json({
        message: "You do not have permission to cancel this order",
      });
    }

    // Can only cancel pending orders (unless admin)
    if (
      userRole !== "admin" &&
      order.orderStatus !== "pending"
    ) {
      return res.status(400).json({
        message: "Can only cancel pending orders",
      });
    }

    order.orderStatus = "cancelled";
    order.cancelReason = cancelReason || "User requested cancellation";
    await order.save();

    return res.status(200).json({
      message: "Order cancelled successfully",
      order,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Cancel failed" });
  }
};

// Get order statistics (Admin only)
export const getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({
      orderStatus: "pending",
    });
    const shippedOrders = await Order.countDocuments({
      orderStatus: "shipped",
    });
    const deliveredOrders = await Order.countDocuments({
      orderStatus: "delivered",
    });
    const cancelledOrders = await Order.countDocuments({
      orderStatus: "cancelled",
    });

    const totalRevenue = await Order.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: "$orderSummary.total",
          },
        },
      },
    ]);

    return res.status(200).json({
      totalOrders,
      pendingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Fetch failed" });
  }
};
