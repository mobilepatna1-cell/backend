import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import {
  getHeroSections,
  getAllHeroSections,
  createHeroSection,
  updateHeroSection,
  deleteHeroSection,
  getAllProductsForHero,
} from "../controllers/heroSectionController.js";

const router = express.Router();

// Public: Get active hero sections (for frontend)
router.get("/", getHeroSections);

// Public: Get all products for hero dropdown
router.get("/products/dropdown", getAllProductsForHero);

// Admin-only: Get all hero sections (paginated)
router.get("/admin/all", authenticate, authorizeRoles("admin"), getAllHeroSections);

// Admin-only: Create hero section
router.post("/admin/create", authenticate, authorizeRoles("admin"), createHeroSection);

// Admin-only: Update hero section
router.put("/admin/:id", authenticate, authorizeRoles("admin"), updateHeroSection);

// Admin-only: Delete hero section
router.delete("/admin/:id", authenticate, authorizeRoles("admin"), deleteHeroSection);

export default router;
