import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid Authorization header" });
  }

  const token = header.split(" ")[1];
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    return res.status(500).json({ message: "JWT access secret is not configured" });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = {
      id: decoded.sub,
      role: decoded.role,
      number: decoded.number,  // ✅ number instead of email
    };
    return next();
  } catch (_err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) return res.status(401).json({ message: "Unauthorized" });
    if (!allowedRoles.includes(role)) return res.status(403).json({ message: "Forbidden" });
    return next();
  };
};