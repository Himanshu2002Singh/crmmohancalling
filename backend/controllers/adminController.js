// controllers/adminController.js
const Admin = require("../models/adminModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const SECRETE_KEY = process.env.SECRET_KEY || "trustingbrains_secret_key";

// Helper to generate token
const generateToken = (admin) => {
  return jwt.sign(
    { id: admin.admin_id, username: admin.username, role: admin.role },
    SECRETE_KEY,
    { expiresIn: "30d" }
  );
};

// ==================== ADMIN AUTH ====================

// Register a new admin (only superadmin can create admins)
exports.registerAdmin = async (req, res) => {
  try {
    const { username, password, email, company_name, phone, role } = req.body;

    // Check if username or email already exists
    const existingAdmin = await Admin.findOne({
      where: { username },
    });
    if (existingAdmin) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const existingEmail = await Admin.findOne({
      where: { email },
    });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const newAdmin = await Admin.create({
      username,
      password, // In production, hash this!
      email,
      company_name,
      phone,
      role: role || "admin",
    });

    const token = generateToken(newAdmin);

    res.status(201).json({
      message: "Admin created successfully",
      token,
      admin: {
        admin_id: newAdmin.admin_id,
        username: newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role,
        company_name: newAdmin.company_name,
      },
    });
  } catch (error) {
    console.error("Error registering admin:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Admin Login
exports.loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    const admin = await Admin.findOne({ where: { username } });

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password (plain text comparison - in production use bcrypt)
    if (admin.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if admin is active
    if (!admin.is_active) {
      return res
        .status(403)
        .json({ message: "Account is deactivated. Contact superadmin." });
    }

    const token = generateToken(admin);

    res.status(200).json({
      message: "Login successful",
      token,
      admin: {
        admin_id: admin.admin_id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        company_name: admin.company_name,
        wallet_balance: admin.wallet_balance,
      },
    });
  } catch (error) {
    console.error("Error logging in admin:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get admin profile
exports.getAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.id;

    const admin = await Admin.findByPk(adminId, {
      attributes: { exclude: ["password"] },
    });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json({ admin });
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update admin profile
exports.updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { company_name, phone, email } = req.body;

    const admin = await Admin.findByPk(adminId);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    await admin.update({
      company_name: company_name || admin.company_name,
      phone: phone || admin.phone,
      email: email || admin.email,
    });

    res.status(200).json({
      message: "Profile updated successfully",
      admin: {
        admin_id: admin.admin_id,
        username: admin.username,
        email: admin.email,
        company_name: admin.company_name,
        phone: admin.phone,
      },
    });
  } catch (error) {
    console.error("Error updating admin profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== SUPER ADMIN FUNCTIONS ====================

// Get all admins (superadmin only)
exports.getAllAdmins = async (req, res) => {
  try {
    // Check if requester is superadmin
    if (req.user.role !== "superadmin") {
      return res
        .status(403)
        .json({ message: "Access denied. Superadmin only." });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";

    const whereClause = search
      ? {
          [require("sequelize").Op.or]: [
            { username: { [require("sequelize").Op.like]: `%${search}%` } },
            { email: { [require("sequelize").Op.like]: `%${search}%` } },
            {
              company_name: { [require("sequelize").Op.like]: `%${search}%` },
            },
          ],
        }
      : {};

    const { count, rows: admins } = await Admin.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ["password"] },
      limit,
      offset,
      order: [["created_at", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      message: "success",
      admins,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Activate/Deactivate admin (superadmin only)
exports.toggleAdminStatus = async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res
        .status(403)
        .json({ message: "Access denied. Superadmin only." });
    }

    const { adminId } = req.params;
    const { is_active } = req.body;

    const admin = await Admin.findByPk(adminId);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Prevent superadmin from deactivating themselves
    if (admin.admin_id === req.user.id) {
      return res
        .status(400)
        .json({ message: "Cannot deactivate your own account" });
    }

    await admin.update({ is_active });

    res.status(200).json({
      message: is_active ? "Admin activated" : "Admin deactivated",
      admin: {
        admin_id: admin.admin_id,
        username: admin.username,
        is_active: admin.is_active,
      },
    });
  } catch (error) {
    console.error("Error toggling admin status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete admin (superadmin only)
exports.deleteAdmin = async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res
        .status(403)
        .json({ message: "Access denied. Superadmin only." });
    }

    const { adminId } = req.params;

    const admin = await Admin.findByPk(adminId);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Prevent superadmin from deleting themselves
    if (admin.admin_id === req.user.id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    await admin.destroy();

    res.status(200).json({ message: "Admin deleted successfully" });
  } catch (error) {
    console.error("Error deleting admin:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get admin wallet balance
exports.getAdminWallet = async (req, res) => {
  try {
    const adminId = req.params.adminId || req.user.id;

    // Only allow admins to view their own wallet or superadmin to view all
    if (req.user.role !== "superadmin" && req.user.id !== adminId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const admin = await Admin.findByPk(adminId, {
      attributes: ["admin_id", "username", "email", "wallet_balance"],
    });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json({ wallet: admin.wallet_balance });
  } catch (error) {
    console.error("Error fetching wallet:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

