// controllers/subscriptionController.js
const Admin = require("../models/adminModel");
const SubscriptionPlan = require("../models/subscriptionPlanModel");
const AdminSubscription = require("../models/adminSubscriptionModel");
const Transaction = require("../models/transactionModel");
const Razorpay = require("razorpay");
const { Op } = require("sequelize");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "your_razorpay_key_id",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "your_razorpay_key_secret",
});

// ==================== PRICING PLANS (Super Admin) ====================

// Create subscription plan (superadmin only)
exports.createSubscriptionPlan = async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res
        .status(403)
        .json({ message: "Access denied. Superadmin only." });
    }

    const {
      plan_name,
      description,
      price_per_employee_per_month,
      min_employees,
      max_employees,
      features,
    } = req.body;

    const plan = await SubscriptionPlan.create({
      plan_name,
      description,
      price_per_employee_per_month,
      min_employees: min_employees || 1,
      max_employees,
      features,
      created_by_admin_id: req.user.id,
    });

    res.status(201).json({
      message: "Subscription plan created successfully",
      plan,
    });
  } catch (error) {
    console.error("Error creating subscription plan:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all subscription plans
exports.getAllPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll({
      where: { is_active: true },
      order: [["price_per_employee_per_month", "ASC"]],
    });

    res.status(200).json({ plans });
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update subscription plan (superadmin only)
exports.updateSubscriptionPlan = async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res
        .status(403)
        .json({ message: "Access denied. Superadmin only." });
    }

    const { planId } = req.params;
    const updateData = req.body;

    const plan = await SubscriptionPlan.findByPk(planId);

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    await plan.update(updateData);

    res.status(200).json({
      message: "Plan updated successfully",
      plan,
    });
  } catch (error) {
    console.error("Error updating plan:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete subscription plan (superadmin only)
exports.deleteSubscriptionPlan = async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res
        .status(403)
        .json({ message: "Access denied. Superadmin only." });
    }

    const { planId } = req.params;

    const plan = await SubscriptionPlan.findByPk(planId);

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    // Soft delete - just mark as inactive
    await plan.update({ is_active: false });

    res.status(200).json({ message: "Plan deleted successfully" });
  } catch (error) {
    console.error("Error deleting plan:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== SUBSCRIPTION & PAYMENT ====================

// Calculate price based on employees and duration (in months)
const calculatePrice = (pricePerEmployeePerMonth, numEmployees, months) => {
  return pricePerEmployeePerMonth * numEmployees * months;
};

// Calculate price for daily billing
const calculateDailyPrice = (pricePerEmployeePerMonth, numEmployees, days) => {
  const pricePerDay = pricePerEmployeePerMonth / 30;
  return pricePerDay * numEmployees * days;
};

// Create Razorpay order for subscription
exports.createSubscriptionOrder = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { plan_id, num_employees, billing_type, billing_duration, custom_days } = req.body;

    if (!adminId) {
      return res.status(400).json({ message: "Admin ID not found in token. Please login again." });
    }

    // Get the plan
    const plan = await SubscriptionPlan.findByPk(plan_id);

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    // Validate employee count
    if (num_employees < plan.min_employees) {
      return res.status(400).json({
        message: `Minimum ${plan.min_employees} employees required`,
      });
    }

    if (plan.max_employees && num_employees > plan.max_employees) {
      return res.status(400).json({
        message: `Maximum ${plan.max_employees} employees allowed`,
      });
    }

    // Calculate amount based on billing type
    let days = 30; // Default monthly
    let totalAmount;
    let months = billing_duration || 1; // Default 1 month

    if (billing_type === "daily") {
      days = custom_days || 1;
      totalAmount = calculateDailyPrice(
        parseFloat(plan.price_per_employee_per_month),
        num_employees,
        days
      );
    } else {
      // Monthly billing with duration (1, 2, 3, 6, 12 months)
      days = months * 30;
      totalAmount = calculatePrice(
        parseFloat(plan.price_per_employee_per_month),
        num_employees,
        months
      );
    }

    // Check for existing active subscription
    const existingSubscription = await AdminSubscription.findOne({
      where: {
        admin_id: adminId,
        status: "active",
        end_date: { [Op.gte]: new Date() },
      },
      order: [["end_date", "DESC"]],
    });

    // BLOCK: If there's an active subscription, don't allow buying new one
    if (existingSubscription) {
      return res.status(400).json({
        message: "You already have an active subscription. Please wait for it to expire or use 'Increase Employees' option to add more employees.",
        current_subscription: {
          plan_name: existingSubscription.plan_name,
          end_date: existingSubscription.end_date,
          num_employees: existingSubscription.num_employees,
        },
        can_increase_employees: true,
      });
    }

    const isRenewal = false;

    // Full payment via Razorpay (no wallet)
    const razorpayAmount = totalAmount;

    // Calculate start and end dates
    let startDate, endDate;
    
    if (isRenewal) {
      // NEW PLAN: Starts AFTER current subscription ends (not extending current)
      // This prevents loss - user pays for full new plan, gets validity from after current ends
      startDate = new Date(existingSubscription.end_date);
      endDate = new Date(existingSubscription.end_date);
    } else {
      startDate = new Date();
      endDate = new Date();
    }
    
    if (billing_type === "daily") {
      endDate.setDate(endDate.getDate() + days);
    } else {
      endDate.setMonth(endDate.getMonth() + months);
    }

    // Create Razorpay order
    const amountInPaise = Math.round(razorpayAmount * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `sub_${adminId}_${Date.now()}`,
      notes: {
        admin_id: adminId,
        plan_id: plan_id,
        num_employees: num_employees,
        billing_type: billing_type,
        billing_duration: months,
        is_renewal: isRenewal,
      },
    });

    // Create pending subscription record
    const subscription = await AdminSubscription.create({
      admin_id: adminId,
      plan_id: plan_id,
      plan_name: plan.plan_name,
      num_employees: num_employees,
      billing_type: billing_type || "monthly",
      billing_duration: months,
      start_date: startDate,
      end_date: endDate,
      total_amount: totalAmount,
      razorpay_order_id: razorpayOrder.id,
      status: "pending",
      is_renewal: isRenewal,
    });

    res.status(200).json({
      message: "Order created successfully",
      order_id: razorpayOrder.id,
      amount: razorpayAmount,
      total_amount: totalAmount,
      currency: "INR",
      plan_name: plan.plan_name,
      num_employees,
      days,
      months,
      is_renewal: isRenewal,
    });
  } catch (error) {
    console.error("Error creating subscription order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Verify payment and activate subscription
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // Verify signature
    const crypto = require("crypto");
    const secret = process.env.RAZORPAY_KEY_SECRET || "your_razorpay_key_secret";
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    // Find the pending subscription
    const subscription = await AdminSubscription.findOne({
      where: { razorpay_order_id },
    });

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    const adminId = subscription.admin_id;
    const admin = await Admin.findByPk(adminId);
    
    // No wallet/cashback - just verify payment (wallet removed)

    // Check if this is a renewal/extension
    const isRenewal = subscription.is_renewal;
    let existingSubscription = null;
    
    if (isRenewal) {
      existingSubscription = await AdminSubscription.findOne({
        where: {
          admin_id: adminId,
          status: "active",
          end_date: { [Op.gte]: new Date() },
        },
        order: [["end_date", "DESC"]],
      });
    }

    if (isRenewal && existingSubscription) {
      // NEW SUBSCRIPTION: Not extending current, but creating new one AFTER current ends
      // This prevents superadmin loss - user pays full price for new plan
      // Current subscription stays as is until it expires, new one starts after
      
      // Mark the new pending subscription as active (for future use)
      await subscription.update({
        status: "active",
        payment_id: razorpay_payment_id,
        razorpay_signature,
      });

      // Create transaction record
      await Transaction.create({
        admin_id: adminId,
        amount: subscription.total_amount,
        payment_id: razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        transaction_type: "debit",
        payment_method: "razorpay",
        description: `New Subscription: ${subscription.plan_name} - ${subscription.num_employees} employees, ${subscription.billing_duration} months (starts after current plan ends)`,
        status: "success",
      });

      res.status(200).json({
        message: "New subscription purchased successfully (will activate after current plan expires)",
        subscription: {
          subscription_id: subscription.subscription_id,
          status: "active",
          num_employees: subscription.num_employees,
          start_date: subscription.start_date,
          end_date: subscription.end_date,
        },
        current_subscription: {
          subscription_id: existingSubscription.subscription_id,
          end_date: existingSubscription.end_date,
        },
        new_subscription_starts_after: existingSubscription.end_date,
      });
    } else {
      // New subscription (original logic)
      await subscription.update({
        status: "active",
        payment_id: razorpay_payment_id,
        razorpay_signature,
      });

      // Create transaction record
      await Transaction.create({
        admin_id: adminId,
        amount: subscription.total_amount,
        payment_id: razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        transaction_type: "debit",
        payment_method: "razorpay",
        description: `Subscription: ${subscription.plan_name} - ${subscription.num_employees} employees`,
        status: "success",
      });

      res.status(200).json({
        message: "Payment verified and subscription activated",
        subscription: {
          subscription_id: subscription.subscription_id,
          status: subscription.status,
          num_employees: subscription.num_employees,
          start_date: subscription.start_date,
          end_date: subscription.end_date,
        },
      });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get admin's current subscription
exports.getCurrentSubscription = async (req, res) => {
  try {
    const adminId = req.user.id;

    const subscription = await AdminSubscription.findOne({
      where: {
        admin_id: adminId,
        status: "active",
        end_date: { [Op.gte]: new Date() },
      },
      order: [["end_date", "DESC"]],
    });

    if (!subscription) {
      return res.status(404).json({ message: "No active subscription found" });
    }

    res.status(200).json({ subscription });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get admin's subscription history
exports.getSubscriptionHistory = async (req, res) => {
  try {
    const adminId = req.user.id;

    const subscriptions = await AdminSubscription.findAll({
      where: { admin_id: adminId },
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({ subscriptions });
  } catch (error) {
    console.error("Error fetching subscription history:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get transaction history
exports.getTransactionHistory = async (req, res) => {
  try {
    const adminId = req.user.id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where: { admin_id: adminId },
      limit,
      offset,
      order: [["created_at", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      transactions,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Recharge wallet directly
exports.rechargeWallet = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // Create Razorpay order for wallet recharge
    const amountInPaise = Math.round(amount * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `wallet_${adminId}_${Date.now()}`,
      notes: {
        admin_id: adminId,
        type: "wallet_recharge",
      },
    });

    res.status(200).json({
      message: "Wallet recharge order created",
      order_id: razorpayOrder.id,
      amount: amount,
      currency: "INR",
    });
  } catch (error) {
    console.error("Error creating recharge order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Verify wallet recharge payment
exports.verifyWalletRecharge = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } =
      req.body;

    // Verify signature
    const crypto = require("crypto");
    const secret = process.env.RAZORPAY_KEY_SECRET || "your_razorpay_key_secret";
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    // Find the admin
    const admin = await Admin.findByPk(req.user.id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Update wallet balance
    const newBalance = parseFloat(admin.wallet_balance) + parseFloat(amount);
    await admin.update({ wallet_balance: newBalance });

    // Create transaction record
    await Transaction.create({
      admin_id: req.user.id,
      amount: amount,
      payment_id: razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      transaction_type: "credit",
      payment_method: "razorpay",
      description: "Wallet Recharge",
      status: "success",
    });

    res.status(200).json({
      message: "Wallet recharged successfully",
      new_balance: newBalance,
    });
  } catch (error) {
    console.error("Error verifying wallet recharge:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get wallet balance
exports.getWalletBalance = async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.user.id, {
      attributes: ["admin_id", "username", "wallet_balance"],
    });

    res.status(200).json({
      wallet_balance: admin.wallet_balance,
    });
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Razorpay key (public endpoint)
exports.getRazorpayKey = async (req, res) => {
  try {
    res.status(200).json({
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Error fetching Razorpay key:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Check if admin can add more employees
exports.checkEmployeeLimit = async (req, res) => {
  try {
    const adminId = req.user.id;

    const subscription = await AdminSubscription.findOne({
      where: {
        admin_id: adminId,
        status: "active",
        end_date: { [Op.gte]: new Date() },
      },
    });

    if (!subscription) {
      return res.status(200).json({
        can_add: false,
        message: "No active subscription",
        current_employees: 0,
        max_employees: 0,
      });
    }

    // Count current employees
    const Employee = require("../models/employeesModel");
    const employeeCount = await Employee.count({
      where: { admin_id: adminId },
    });

    const canAdd = employeeCount < subscription.num_employees;

    res.status(200).json({
      can_add: canAdd,
      current_employees: employeeCount,
      max_employees: subscription.num_employees,
      remaining: subscription.num_employees - employeeCount,
    });
  } catch (error) {
    console.error("Error checking employee limit:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Increase employees on existing subscription
// When employees increase, validity decreases proportionally (no extra payment)
exports.increaseEmployees = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { additional_employees } = req.body;

    if (!additional_employees || additional_employees <= 0) {
      return res.status(400).json({ message: "Please specify number of additional employees" });
    }

    // Get current subscription
    const subscription = await AdminSubscription.findOne({
      where: {
        admin_id: adminId,
        status: "active",
        end_date: { [Op.gte]: new Date() },
      },
    });

    if (!subscription) {
      return res.status(404).json({ message: "No active subscription found" });
    }

    // Calculate remaining days
    const now = new Date();
    const endDate = new Date(subscription.end_date);
    const remainingDays = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
    
    // Old employee count
    const oldEmployees = subscription.num_employees;
    // New employee count after increase
    const newEmployees = oldEmployees + additional_employees;

    // Calculate new validity using proportional reduction formula:
    // new_days = (old_days × old_employees) / new_employees
    const newRemainingDays = Math.ceil((remainingDays * oldEmployees) / newEmployees);
    
    // Calculate new end date
    const newEndDate = new Date(now);
    newEndDate.setDate(newEndDate.getDate() + newRemainingDays);

    // Update subscription with more employees and reduced validity
    await subscription.update({
      num_employees: newEmployees,
      end_date: newEndDate,
      // total_amount stays the same (no extra payment)
    });

    // Create transaction record (no payment required)
    await Transaction.create({
      admin_id: adminId,
      amount: 0,
      transaction_type: "debit",
      payment_method: "free",
      description: `Employee limit increased from ${oldEmployees} to ${newEmployees}. Validity reduced from ${remainingDays} to ${newRemainingDays} days (proportional)`,
      status: "success",
    });

    res.status(200).json({
      message: "Employees increased successfully",
      subscription: {
        subscription_id: subscription.subscription_id,
        num_employees: newEmployees,
        end_date: newEndDate,
        remaining_days: newRemainingDays,
      },
      previous_validity: remainingDays,
      new_validity: newRemainingDays,
      validity_reduced: remainingDays - newRemainingDays,
    });
  } catch (error) {
    console.error("Error increasing employees:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Verify payment and add employees (DEPRECATED - now using proportional validity, no payment needed)
exports.verifyEmployeeIncrease = async (req, res) => {
  try {
    // This function is deprecated - employees now increase with proportional validity reduction, no payment required
    // Please use increaseEmployees endpoint instead
    res.status(410).json({ 
      message: "This endpoint is deprecated. Use POST /subscription/increase-employees instead.",
      deprecated: true 
    });
  } catch (error) {
    console.error("Error in deprecated verifyEmployeeIncrease:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

