import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import { getAllUsers, getUserById, deleteUser } from "../controllers/userController.js";

const router = express.Router();

// Admin-only: get all users
router.get("/", authenticate, authorizeRoles("admin"), getAllUsers);

// Admin-only: get specific user by ID
router.get("/:id", authenticate, authorizeRoles("admin"), getUserById);

// Admin-only: delete a user
router.delete("/:id", authenticate, authorizeRoles("admin"), deleteUser);

export default router;

