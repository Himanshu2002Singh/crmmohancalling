// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const subscriptionController = require("../controllers/subscriptionController");
const { isAuthenticated } = require("../middlewares/isAuthenticated");

// ==================== ADMIN AUTH ====================
// Public routes (login/register)
router.post("/admin/register", adminController.registerAdmin);
router.post("/admin/login", adminController.loginAdmin);

// Protected routes (require authentication)
router.get("/admin/profile", isAuthenticated, adminController.getAdminProfile);
router.put("/admin/profile", isAuthenticated, adminController.updateAdminProfile);

// ==================== SUPER ADMIN ONLY ====================
// Get all admins
router.get(
  "/superadmin/admins",
  isAuthenticated,
  adminController.getAllAdmins
);

// Toggle admin status (activate/deactivate)
router.put(
  "/superadmin/admin/:adminId/toggle",
  isAuthenticated,
  adminController.toggleAdminStatus
);

// Delete admin
router.delete(
  "/superadmin/admin/:adminId",
  isAuthenticated,
  adminController.deleteAdmin
);

// Create subscription plan
router.post(
  "/superadmin/plans",
  isAuthenticated,
  subscriptionController.createSubscriptionPlan
);

// Update subscription plan
router.put(
  "/superadmin/plans/:planId",
  isAuthenticated,
  subscriptionController.updateSubscriptionPlan
);

// Delete subscription plan
router.delete(
  "/superadmin/plans/:planId",
  isAuthenticated,
  subscriptionController.deleteSubscriptionPlan
);

// ==================== SUBSCRIPTION ====================
// Get all plans (public - for admin to view)
router.get("/plans", subscriptionController.getAllPlans);

// Get current subscription
router.get(
  "/subscription/current",
  isAuthenticated,
  subscriptionController.getCurrentSubscription
);

// Get subscription history
router.get(
  "/subscription/history",
  isAuthenticated,
  subscriptionController.getSubscriptionHistory
);

// Create subscription order
router.post(
  "/subscription/create-order",
  isAuthenticated,
  subscriptionController.createSubscriptionOrder
);

// Verify subscription payment
router.post(
  "/subscription/verify-payment",
  isAuthenticated,
  subscriptionController.verifyPayment
);

// Check employee limit
router.get(
  "/subscription/check-employee-limit",
  isAuthenticated,
  subscriptionController.checkEmployeeLimit
);

// Increase employees on subscription (FREE - proportional validity reduction)
router.post(
  "/subscription/increase-employees",
  isAuthenticated,
  subscriptionController.increaseEmployees
);

// Get transaction history
router.get(
  "/transactions",
  isAuthenticated,
  subscriptionController.getTransactionHistory
);

// Get Razorpay key (public)
router.get(
  "/razorpay-key",
  subscriptionController.getRazorpayKey
);

module.exports = router;

