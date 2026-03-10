const express = require("express");
const attendancecontroller = require("../controllers/attendance_controller");
const router = express.Router();
const auth = require("../middlewares/isAuthenticated");
const checkSubscription = require("../middlewares/checkSubscription");

// Mark attendance - requires active subscription
router.post(
  "/markattendance",
  auth.isAuthenticated,
  checkSubscription,
  attendancecontroller.markattendance
);

// Close attendance - requires active subscription
router.put(
  "/closeattendance/:id",
  auth.isAuthenticated,
  checkSubscription,
  attendancecontroller.closeattendance
);

// These routes are for viewing data - can be accessed without subscription
router.get(
  "/checkattendance",
  auth.isAuthenticated,
  attendancecontroller.checkattendance
);

router.get(
  "/myattendance",
  auth.isAuthenticated,
  attendancecontroller.myattendance
);

router.get(
  "/:id/attendancedetails",
  attendancecontroller.getcompleteuserdetailsattendance
);

router.get("/monthlyattendance/:month", attendancecontroller.getMonthlyAttendance);

module.exports = router;
