const express = require('express');
const router = express.Router();
const {
  receiveWaterLevel,
  getWaterLevels,
  getLatestLevel,
} = require('../Controllers/WaterLevelSensorController');

router.post('/',       receiveWaterLevel);
router.get('/',        getWaterLevels);
router.get('/latest',  getLatestLevel);

module.exports = router;