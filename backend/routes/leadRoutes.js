const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const upload = require('../middlewares/upload');
const checkSubscription = require('../middlewares/checkSubscription');

// Apply subscription check to data modification routes
router.post('/submit-lead', checkSubscription, leadController.addLead);
router.put('/leads/:id', checkSubscription, leadController.updateLead);
router.delete('/delete-lead/:id', checkSubscription, leadController.deleteLead);
router.post(
  '/addLeadsFromExcel',
  checkSubscription,
  upload.single('file'),
  leadController.importLeadsFromExcel
);

// These routes are for viewing data - can be accessed without subscription
router.get('/leads', leadController.getLeads);
router.get('/leads/:emp_id', leadController.getLeadsById);
router.get('/getLead/:id', leadController.getLeadDetails);
router.get('/getLeadsByDate', leadController.leadsByDate);
router.get('/getLeadsByEmpIdAndDate/:emp_id', leadController.leadsByEmpIdAndDate);
router.get('/getCountsByEmpId/:emp_id', leadController.getLeadCountByEmpId);
router.get('/getFreshLeadsByEmpId/:emp_id', leadController.getFreshLeadsByEmpId);
router.get('/getLeadByNumber/:lead_number', leadController.getLeadByNumber);
router.get('/getLeadsForAdminPanel', leadController.getLeadsForAdminPanel);
router.get('/getFollowupsCount', leadController.getLeadsByNextMeeting);
router.get('/getFilteredLeads', leadController.getFilteredLeads);

module.exports = router;
