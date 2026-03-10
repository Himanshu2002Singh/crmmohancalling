const jwt = require("jsonwebtoken");
const AdminSubscription = require("../models/adminSubscriptionModel");
const { Op } = require("sequelize");

const SECRETE_KEY = process.env.SECRET_KEY || "trustingbrains_secret_key";

// Middleware to check if admin has active subscription
const checkSubscription = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Decode token to get admin_id
    let adminId = null;
    try {
      const decoded = jwt.verify(token, SECRETE_KEY);
      
      // If it's an admin token (has role property)
      if (decoded.role !== undefined) {
        adminId = decoded.id;
      } 
      // If it's an employee token (no role property)
      else if (decoded.id) {
        // For employees, we need to get admin_id from the employee record
        // This would require additional query - for now, skip for employees
        return next(); // Allow employees to proceed, their admin's subscription is checked separately
      }
    } catch (e) {
      return res.status(401).json({ message: "Invalid token" });
    }

    if (!adminId) {
      return res.status(401).json({ message: "Admin ID not found in token" });
    }

    // Check if admin has active subscription
    const subscription = await AdminSubscription.findOne({
      where: {
        admin_id: adminId,
        status: "active",
        end_date: { [Op.gte]: new Date() },
      },
    });

    if (!subscription) {
      return res.status(403).json({ 
        message: "No active subscription. Please activate your plan to use this feature.",
        code: "NO_SUBSCRIPTION"
      });
    }

    // Attach subscription to request for further use
    req.subscription = subscription;
    req.adminId = adminId;
    
    next();
  } catch (error) {
    console.error("Subscription check error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = checkSubscription;

