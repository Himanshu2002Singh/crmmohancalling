const Employee = require("../models/employeesModel");
const XLSX = require("xlsx");
const nodemailer = require("nodemailer");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AdminSubscription = require("../models/adminSubscriptionModel");

const SECRETE_KEY = process.env.SECRET_KEY || "trustingbrains_secret_key";

// Middleware to check subscription and get admin_id from token
const getAdminIdFromToken = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, SECRETE_KEY);
      // If it's an employee, get their admin_id from the employee record
      if (decoded.role === undefined) {
        return null; // Employee login - use their linked admin
      }
      return decoded.id; // Admin - use their ID
    } catch (e) {
      return null;
    }
  }
  return null;
};

// Check if admin has active subscription and employee limit
const checkSubscription = async (adminId) => {
  if (!adminId) return { allowed: false, reason: "No admin context" };

  const subscription = await AdminSubscription.findOne({
    where: {
      admin_id: adminId,
      status: "active",
      end_date: { [Op.gte]: new Date() },
    },
  });

  if (!subscription) {
    return { allowed: false, reason: "No active subscription" };
  }

  const employeeCount = await Employee.count({
    where: { admin_id: adminId },
  });

  if (employeeCount >= subscription.num_employees) {
    return {
      allowed: false,
      reason: `Employee limit reached. Maximum ${subscription.num_employees} employees allowed.`,
    };
  }

  return { allowed: true, remaining: subscription.num_employees - employeeCount };
};

exports.addEmployee = async (req, res) => {
  const { email, username, ename, password, phone, admin_id } = req.body;
  console.log("===================> employee add functionstart");
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "username and password are required" });
  }
  console.log("===================> employee add check se pahale");

  let check = null;
  // Check subscription if admin_id is provided
  if (admin_id) {
    check = await checkSubscription(admin_id);
    if (!check.allowed) {
      return res.status(403).json({ message: check.reason });
    }
  }
  console.log("===================> employee add check complete");

  try {
    const newEmployee = await Employee.create({
      email,
      phone,
      username,
      ename,
      password,
      admin_id: admin_id || null,
    });
    console.log("===================> employee create done");

    return res.status(200).json({
      message: "employee added successfully",
      remaining_employees: check?.remaining ?? null,
    });
  } catch (error) {
    console.error("Error adding employee:", error);
    return res.status(500).json({ message: "Database error", error });
  }
};

exports.getEmployees = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const offset = (page - 1) * limit;

    // Get admin_id from query params or token
    const adminId = req.query.admin_id || getAdminIdFromToken(req);

    const whereClause = {
      ...(adminId ? { admin_id: adminId } : {}),
      ...(search
        ? {
            [Op.or]: [
              { ename: { [Op.like]: `%${search}%` } },
              { email: { [Op.like]: `%${search}%` } },
              { emp_id: { [Op.like]: `%${search}%` } },
              { phone: { [Op.like]: `%${search}%` } },
              { username: { [Op.like]: `%${search}%` } },
            ],
          }
        : {}),
    };

    const { count, rows: employees } = await Employee.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [["emp_id", "ASC"]],
    });

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      message: "success",
      employees,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return res
      .status(500)
      .json({ message: "Database error", error: error.message });
  }
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.createuserusingexcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    // Get admin_id from request body or token
    const adminId = req.body.admin_id || getAdminIdFromToken(req);

    // Check subscription limit
    if (adminId) {
      const check = await checkSubscription(adminId);
      if (!check.allowed) {
        return res.status(403).json({ message: check.reason });
      }
      
      const employeeCount = await Employee.count({ where: { admin_id: adminId } });
      const remaining = check.remaining;
      
      // Check if we have enough slots for all employees in Excel
      if (data.length > remaining) {
        return res.status(400).json({
          message: `Not enough employee slots. You have ${remaining} slots remaining but trying to add ${data.length} employees.`,
        });
      }
    }

    const createdUsers = [];

    for (const row of data) {
      const {
        "User Name": userName,
        "Name": name,
        "Mobile Number": phone,
        "Email Id": email,
      } = row;
      const password = Math.floor(
        10000000 + Math.random() * 90000000
      ).toString();

      const newUser = await Employee.create({
        ename: name,
        phone,
        email,
        username: userName,
        password: password,
        admin_id: adminId || null,
      });

      createdUsers.push({
        username: newUser.username,
        name: newUser.ename,
        email: newUser.email,
        password: password,
      });
    }

    res.status(200).json({
      message: "Users created successfully",
      users: createdUsers,
    });
  } catch (error) {
    console.log("Error creating users from Excel:", error);
    res
      .status(500)
      .json({ message: "Error creating users", error: error.message });
  }
};

exports.loginEmployee = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "username and password are required fields" });
  }

  try {
    const employee = await Employee.findOne({ where: { username } });

    if (!employee) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Check if employee is active
    if (employee.is_active === false) {
      return res.status(403).json({ message: "Your account has been deactivated. Contact your admin." });
    }

    if (employee.password !== password) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Check if admin has active subscription
    if (employee.admin_id) {
      const subscription = await AdminSubscription.findOne({
        where: {
          admin_id: employee.admin_id,
          status: "active",
          end_date: { [Op.gte]: new Date() },
        },
      });

      if (!subscription) {
        return res.status(403).json({
          message: "Your organization's subscription has expired. Please contact your admin to renew.",
        });
      }
    }

    const token = jwt.sign(
      { id: employee.emp_id, username: employee.username },
      SECRETE_KEY,
      { expiresIn: "30d" }
    );

    return res.status(200).json({
      message: "login Successfull",
      token,
      employee: {
        emp_id: employee.emp_id,
        username: employee.username,
        email: employee.email,
        ename: employee.ename,
        admin_id: employee.admin_id,
      },
    });
  } catch (e) {
    console.error("login error : ", e);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: e.message });
  }
};

// Check if admin has active subscription (for employees)
exports.checkAdminSubscription = async (req, res) => {
  try {
    // Get employee from token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, SECRETE_KEY);
    const employee = await Employee.findByPk(decoded.id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (!employee.admin_id) {
      // No admin linked - allow access
      return res.status(200).json({
        is_active: true,
        message: "No subscription required"
      });
    }

    // Check admin's subscription
    const subscription = await AdminSubscription.findOne({
      where: {
        admin_id: employee.admin_id,
        status: "active",
        end_date: { [Op.gte]: new Date() },
      },
    });

    if (!subscription) {
      return res.status(200).json({
        is_active: false,
        message: "Your organization's subscription has expired. Please contact your admin to renew."
      });
    }

    return res.status(200).json({
      is_active: true,
      message: "Subscription is active",
      subscription: {
        plan_name: subscription.plan_name,
        end_date: subscription.end_date,
        num_employees: subscription.num_employees
      }
    });
  } catch (error) {
    console.error("Error checking subscription:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getEmployeeById = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await Employee.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch {
    console.error("Error fetching user by id", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateEmployee = async (req, res) =>{
  const userId = req.params.id;
  const updateData = req.body; 
  if(!userId) {
    return res.status(400).json({ message: 'Employee ID is required' });
  }
  try{
      const [updated] = await Employee.update(updateData, {
        where: { emp_id: userId }
      });  
      if (updated === 0) {
        return res.status(404).json({ message: 'User not found or no changes made' });
      }

      res.status(200).json({ message: 'Employee data updated successfully' });  
  }catch (error) {
      console.error('Error updating employee:', error);
      res.status(500).json({ message: 'Database error', error });
  }
}

exports.deleteEmployee = async (req, res) => {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({ message: "Employee ID is required" });
  }

  try {
    const deleted = await Employee.destroy({
      where: { emp_id: userId },
    });

    if (deleted === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    return res.status(200).json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return res.status(500).json({ message: "Database error", error });
  }
}

