const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const checkSubscription = require("../middlewares/checkSubscription");

// Add task - requires active subscription
router.post('/add_task', checkSubscription, taskController.addTask);
router.put('/update_task/:taskId', checkSubscription, taskController.updateTask);
router.delete('/deleteTask/:taskId', checkSubscription, taskController.deleteTask);

// These routes are for viewing data - can be accessed without subscription
router.get('/task/:id', taskController.getTasks);
router.get('/task_by_lead_id/:id', taskController.getTasksByLeadId);


module.exports = router;
