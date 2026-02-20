const express = require('express');
const router = express.Router();
const reportController = require('../Controllers/Wcontroller');

// Create new report
router.post('/reports', reportController.createReport);

// Get all reports
router.get('/reports', reportController.getReports);

module.exports = router;
