const express = require('express');
const router = express.Router();
const {
  receiveSensorData,
  getSensorReadings,
  getLatestPerDevice,
} = require('../Controllers/Heat_RiskSensorController');

router.post('/',        receiveSensorData);   
router.get('/',         getSensorReadings);   
router.get('/latest',   getLatestPerDevice); 

module.exports = router;