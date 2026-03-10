const express = require("express");
const router = express.Router();
const callsController = require("../controllers/callsController");
const checkSubscription = require("../middlewares/checkSubscription");

// Add calls - requires active subscription
router.post('/calls', checkSubscription, callsController.addCalls);
router.put('/updateCall/:callId', checkSubscription, callsController.updateCall);

// These routes are for viewing data - can be accessed without subscription
router.get('/calls/:id', callsController.getCalls);
router.get('/callsByLeadId/:id', callsController.getCallsByLeadId);
router.get('/callsByDates', callsController.getCallsByDates);
router.get('/callsByEmpIdAndDate/:emp_id', callsController.getCallsByEmpIdAndDates);
router.get('/totalCallsCountByEmployee/:emp_id', callsController.getTotalCallsCountByEmployeeId);
router.get('/filterCalls/:emp_id', callsController.filterCalls);

module.exports = router;
