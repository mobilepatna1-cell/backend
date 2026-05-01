import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import {
  getUserProfile,
  updateUserProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  getAddresses,
} from "../controllers/profileController.js";

const router = express.Router();

// Get user profile (protected)
router.get("/", authenticate, getUserProfile);

// Update user profile (protected)
router.put("/", authenticate, updateUserProfile);

// Get all addresses (protected)
router.get("/addresses", authenticate, getAddresses);

// Add new address (protected)
router.post("/addresses", authenticate, addAddress);

// Update address (protected)
router.put("/addresses/:addressId", authenticate, updateAddress);

// Delete address (protected)
router.delete("/addresses/:addressId", authenticate, deleteAddress);

export default router;
