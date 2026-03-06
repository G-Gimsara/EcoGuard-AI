const express = require('express');
const router = express.Router();
const reportController = require('../Controllers/Wcontroller');

// Create new report
router.post('/reports', reportController.createReport);

// Get all reports
router.get('/reports', reportController.getReports);

router.post('/alerts', reportController.createFloodAlert);
router.get('/alerts', reportController.getAllFloodAlerts);
router.get('/alerts/:id', reportController.getFloodAlertById);

module.exports = router;
