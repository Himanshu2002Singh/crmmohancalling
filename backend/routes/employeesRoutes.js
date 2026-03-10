const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeesController");
const multer = require("multer");
const Employee = require("../models/employeesModel");
const upload = multer({ storage: multer.memoryStorage() });

router.post("/add-employee", employeeController.addEmployee);
router.get("/check-subscription", employeeController.checkAdminSubscription);
router.post(
  "/createuserusingexcel",
  upload.single("file"),
  employeeController.createuserusingexcel
);

router.get("/employees", employeeController.getEmployees);

router.get("/employees/:id", employeeController.getEmployeeById);

router.post("/login", employeeController.loginEmployee);

router.put("/update_employee/:id", employeeController.updateEmployee);
router.delete("/delete_employee/:id", employeeController.deleteEmployee);

module.exports = router;
