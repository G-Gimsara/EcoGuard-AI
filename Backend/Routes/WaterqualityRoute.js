const express = require('express');
const router  = express.Router();
const {
  receivePH,        getPH,
  receiveTurbidity, getTurbidity,
  receiveWaterTemp, getWaterTemp,
} = require('../Controllers/WaterQualityController');

router.post('/ph',         receivePH);
router.get('/ph',          getPH);
router.post('/turbidity',  receiveTurbidity);
router.get('/turbidity',   getTurbidity);
router.post('/water-temp', receiveWaterTemp);
router.get('/water-temp',  getWaterTemp);

module.exports = router;