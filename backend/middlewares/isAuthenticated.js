const jwt = require("jsonwebtoken");

const isAuthenticated = (req, res, next) => {
  const SECRETE_KEY = process.env.SECRET_KEY || "trustingbrains_secret_key";
  try {
    const token = req.headers.authorization.split(" ")[1];
    jwt.verify(token, SECRETE_KEY, (err, user) => {
      if (err) {
        res.status(401).json({ message: "Invalid or expired token" });
      } else {
        req.user = user;
        next();
      }
    });
  } catch (err) {
    return res.status(401).json({ message: "Authentication required" });
  }
};

// Middleware to check if user is superadmin
const isSuperAdmin = (req, res, next) => {
  if (req.user.role !== "superadmin") {
    return res.status(403).json({ message: "Access denied. Superadmin only." });
  }
  next();
};

// Middleware to check if user is admin (either admin or superadmin)
const isAdmin = (req, res, next) => {
  if (!req.user.role || (req.user.role !== "admin" && req.user.role !== "superadmin")) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

module.exports = {
  isAuthenticated,
  isSuperAdmin,
  isAdmin,
};
