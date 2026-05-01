import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import {
	getCart,
	addToCart,
	updateCartItemQuantity,
	removeFromCart,
	clearCart,
	getWishlist,
	addToWishlist,
	removeFromWishlist,
	clearWishlist,
} from "../controllers/cartWishlistController.js";

const router = express.Router();

// ═══════════════════ CART ROUTES ═══════════════════
router.get("/cart", authenticate, getCart); // Get cart
router.post("/cart", authenticate, addToCart); // Add to cart
router.put("/cart", authenticate, updateCartItemQuantity); // Update cart item quantity
router.delete("/cart/:productId", authenticate, removeFromCart); // Remove from cart
router.delete("/cart", authenticate, clearCart); // Clear cart

// ═══════════════════ WISHLIST ROUTES ═══════════════════
router.get("/wishlist", authenticate, getWishlist); // Get wishlist
router.post("/wishlist", authenticate, addToWishlist); // Add to wishlist
router.delete("/wishlist/:productId", authenticate, removeFromWishlist); // Remove from wishlist
router.delete("/wishlist", authenticate, clearWishlist); // Clear wishlist

export default router;
