const express = require("express");
const router = express.Router();
const historyController = require("../controllers/historyController");

router.post('/histories', historyController.addHistory);
router.get('/histories/:id', historyController.getHistory);

module.exports = router;