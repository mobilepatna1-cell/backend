import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import { getDashboardStats } from "../controllers/dashboardController.js";

const router = express.Router();

// Admin-only: get dashboard stats
router.get("/stats", authenticate, authorizeRoles("admin"), getDashboardStats);

export default router;
