import mongoose from "mongoose";
import { Cart, Wishlist } from "../models/CartWishlist.js";
import Product from "../models/Product.js";

// ═══════════════════ CART ENDPOINTS ═══════════════════

// Get user's cart or all carts
export const getCart = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    // Fetch all carts for the user, sorting so the newest updated cart is first
    const userCarts = await Cart.find({ user: userId }).sort({ updatedAt: -1 });

    let cart;

    if (userCarts.length === 0) {
      // 1. No cart exists, create a new one
      cart = await Cart.create({ user: userId, items: [] });
    } else if (userCarts.length === 1) {
      // 2. Exactly one cart exists, use it
      cart = userCarts[0];
    } else {
      // 3. Multiple carts exist due to db inconsistency. Merge them.
      cart = userCarts[0]; // Use the newest cart as the base

      const itemsMap = new Map();
      
      // Add items from the newest cart to the map
      cart.items.forEach(item => {
        if (item.product) {
          itemsMap.set(item.product.toString(), item.quantity);
        }
      });

      // Process older duplicate carts
      for (let i = 1; i < userCarts.length; i++) {
        const duplicateCart = userCarts[i];
        
        duplicateCart.items.forEach(item => {
          if (item.product) {
            const productId = item.product.toString();
            if (itemsMap.has(productId)) {
              itemsMap.set(productId, itemsMap.get(productId) + item.quantity);
            } else {
              itemsMap.set(productId, item.quantity);
            }
          }
        });

        // Delete the duplicate cart from DB
        await Cart.findByIdAndDelete(duplicateCart._id);
      }

      // Rebuild the items array into the base cart
      cart.items = Array.from(itemsMap, ([product, quantity]) => ({ product, quantity }));
      await cart.save();
    }

    await cart.populate("items.product");

    return res.status(200).json({ cart });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Fetch failed" });
  }
};

// Add to cart
export const addToCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res
        .status(400)
        .json({ message: "productId and quantity are required" });
    }

    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid user or product id" });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if product already in cart
    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        quantity,
      });
    }

    await cart.save();
    await cart.populate("items.product");

    return res.status(200).json({
      message: "Added to cart successfully",
      cart,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Add failed" });
  }
};

// Update cart item quantity
export const updateCartItemQuantity = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res
        .status(400)
        .json({ message: "productId and quantity are required" });
    }

    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid user or product id" });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.find((i) => i.product.toString() === productId);
    if (!item) {
      return res.status(404).json({ message: "Item not in cart" });
    }

    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => i.product.toString() !== productId);
    } else {
      item.quantity = quantity;
    }

    await cart.save();
    await cart.populate("items.product");

    return res.status(200).json({
      message: "Cart updated successfully",
      cart,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Update failed" });
  }
};

// Remove from cart
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid user or product id" });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter((i) => i.product.toString() !== productId);

    if (cart.items.length === initialLength) {
      return res.status(404).json({ message: "Item not in cart" });
    }

    await cart.save();
    await cart.populate("items.product");

    return res.status(200).json({
      message: "Removed from cart successfully",
      cart,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Remove failed" });
  }
};

// Clear cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const cart = await Cart.findOneAndUpdate(
      { user: userId },
      { items: [] },
      { new: true }
    );

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    return res.status(200).json({
      message: "Cart cleared successfully",
      cart,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Clear failed" });
  }
};

// ═══════════════════ WISHLIST ENDPOINTS ═══════════════════

// Get user's wishlist
export const getWishlist = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    let wishlist = await Wishlist.findOne({ user: userId }).populate(
      "items.product"
    );

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, items: [] });
    }

    return res.status(200).json({ wishlist });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Fetch failed" });
  }
};

// Add to wishlist
export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid user or product id" });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, items: [] });
    }

    // Check if product already in wishlist
    const exists = wishlist.items.some(
      (item) => item.product.toString() === productId
    );

    if (exists) {
      return res.status(400).json({
        message: "Product already in wishlist",
      });
    }

    wishlist.items.push({
      product: productId,
    });

    await wishlist.save();
    await wishlist.populate("items.product");

    return res.status(200).json({
      message: "Added to wishlist successfully",
      wishlist,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Add failed" });
  }
};

// Remove from wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid user or product id" });
    }

    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    const initialLength = wishlist.items.length;
    wishlist.items = wishlist.items.filter(
      (i) => i.product.toString() !== productId
    );

    if (wishlist.items.length === initialLength) {
      return res.status(404).json({ message: "Item not in wishlist" });
    }

    await wishlist.save();
    await wishlist.populate("items.product");

    return res.status(200).json({
      message: "Removed from wishlist successfully",
      wishlist,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Remove failed" });
  }
};

// Clear wishlist
export const clearWishlist = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const wishlist = await Wishlist.findOneAndUpdate(
      { user: userId },
      { items: [] },
      { new: true }
    );

    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    return res.status(200).json({
      message: "Wishlist cleared successfully",
      wishlist,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Clear failed" });
  }
};
