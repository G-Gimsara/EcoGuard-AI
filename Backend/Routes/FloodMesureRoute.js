const express = require('express');
const router = express.Router();
const {
  receiveFloatStatus,
  getAlerts,
  getLatestStatus,
} = require('../Controllers/FloodAlertDangerController');

router.post('/',        receiveFloatStatus);  // ESP32 posts here
router.get('/alerts',   getAlerts);           // get all danger alerts
router.get('/latest',   getLatestStatus);     // get latest per device

module.exports = router;