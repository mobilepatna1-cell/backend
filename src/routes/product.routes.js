import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} from "../controllers/productController.js";

const router = express.Router();

// Public read
router.get("/", getProducts);
router.get("/:id", getProductById);

// Admin write (add/edit/delete)
router.post("/", authenticate, authorizeRoles("admin"), createProduct);
router.put("/:id", authenticate, authorizeRoles("admin"), updateProduct);
router.delete("/:id", authenticate, authorizeRoles("admin"), deleteProduct);

export default router;

