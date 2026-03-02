const express = require('express');
const router  = express.Router();
const {
  receiveGas,        getGas,
  receiveAirQuality, getAirQuality,
} = require('../Controllers/AirsensorController');

router.post('/gas',         receiveGas);
router.get('/gas',          getGas);
router.post('/air-quality', receiveAirQuality);
router.get('/air-quality',  getAirQuality);

module.exports = router;