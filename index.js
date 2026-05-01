import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./src/config/DB.js";
import dns from "dns";

import authRoutes from "./src/routes/auth.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import productRoutes from "./src/routes/product.routes.js";
import dashboardRoutes from "./src/routes/dashboard.routes.js";
import heroSectionRoutes from "./src/routes/heroSection.routes.js";
import profileRoutes from "./src/routes/profile.routes.js";
import orderRoutes from "./src/routes/order.routes.js";
import cartRoutes from "./src/routes/cart.routes.js";

dns.setServers(["8.8.8.8", "0.0.0.0"]);
dotenv.config();

const app = express();
const PORT = process.env.PORT;

connectDB();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
	return res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/hero", heroSectionRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart-wishlist", cartRoutes);

// 404 handler
app.use((req, res) => {
	return res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, _next) => {
	const statusCode = err?.statusCode || 500;
	return res
		.status(statusCode)
		.json({ message: err?.message || "Server error" });
});

app.listen(PORT, () => {
	console.log(`Server is running on : http://localhost:${PORT}`);
});
