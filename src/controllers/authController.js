import jwt from "jsonwebtoken";
import User from "../models/User.js";

const signAccessToken = (user) => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT access secret is not configured");

  return jwt.sign(
    {
      number: user.number,  // ✅ number instead of email
      role: user.role,
    },
    secret,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15d",
      subject: user._id.toString(),
    }
  );
};

export const login = async (req, res) => {
  try {
    const { number, password } = req.body || {};

    if (!number || !password) {
      return res.status(400).json({ message: "Phone number and password are required" });
    }

    const normalizedNumber = String(number).trim();
    const user = await User.findOne({ number: normalizedNumber }).select("+password");

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = signAccessToken(user);

    return res.status(200).json({
      success: true,
      status: 200,
      message: "Login successful",
      data: { accessToken, user },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Login failed" });
  }
};

export const signup = async (req, res) => {
  try {
    const { name, number, password, role } = req.body || {};

    if (!name || !number || !password) {
      return res.status(400).json({ message: "Name, phone number, and password are required" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const normalizedRole = role ? String(role).toLowerCase() : "user";
    if (!["user", "admin"].includes(normalizedRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (normalizedRole === "admin") {
      const allowAdminSignup = process.env.ALLOW_ADMIN_SIGNUP === "true";
      if (!allowAdminSignup) {
        const existingAdmin = await User.findOne({ role: "admin" }).select("_id").lean();
        if (existingAdmin) {
          return res.status(403).json({ message: "Admin signup is disabled" });
        }
      }
    }

    const normalizedNumber = String(number).trim();
    const existing = await User.findOne({ number: normalizedNumber });
    if (existing) {
      return res.status(409).json({ message: "Phone number already in use" });
    }

    const user = await User.create({
      name: String(name).trim(),
      number: normalizedNumber,
      password,
      role: normalizedRole,
    });

    const accessToken = signAccessToken(user);  // ✅ return token on signup too

    return res.status(201).json({
      success: true,
      status: 201,
      message: "Signup successful",
      data: { accessToken, user },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Signup failed" });
  }
};