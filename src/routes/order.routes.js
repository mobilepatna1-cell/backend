import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import {
  getAllOrders,
  getOrderById,
  getUserOrders,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
} from "../controllers/orderController.js";

const router = express.Router();

// User routes
router.get("/my-orders", authenticate, getUserOrders); // Get user's own orders
router.post("/", authenticate, createOrder); // Create order
router.put("/:id/cancel", authenticate, cancelOrder); // Cancel order

// Admin routes
router.get("/admin/all", authenticate, authorizeRoles("admin"), getAllOrders); // Get all orders (admin only)
router.get("/admin/stats", authenticate, authorizeRoles("admin"), getOrderStats); // Get order statistics (admin only)
router.get("/:id", authenticate, getOrderById); // Get order by ID (user can view own, admin can view any)
router.put("/:id/status", authenticate, authorizeRoles("admin"), updateOrderStatus); // Update order status (admin only)

export default router;
