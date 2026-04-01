const express = require('express');
const router  = express.Router();
const {
  receiveGas,        getGas,
  receiveAirQuality, getAirQuality,

  receiveDust,       getDust,

} = require('../Controllers/AirsensorController');

router.post('/gas',         receiveGas);
router.get('/gas',          getGas);
router.post('/air-quality', receiveAirQuality);
router.get('/air-quality',  getAirQuality);

router.post('/dust',        receiveDust);
router.get('/dust',         getDust);


module.exports = router;