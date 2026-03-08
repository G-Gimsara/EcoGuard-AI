<<<<<<< HEAD
const express = require("express");
const router = express.Router();

const {
  addGas,
  addDust,
  addTempHum,
   getGas,
  getDust,
  getTempHum
} = require("../Controllers/AirsensorController");

router.post("/gas", addGas);
router.post("/dust", addDust);
router.post("/temp_hum", addTempHum);
// GET routes
router.get("/gas", getGas);
router.get("/dust", getDust);
router.get("/temp_hum", getTempHum);
=======
const express = require('express');
const router  = express.Router();
const {
  receiveGas,        getGas,
  receiveAirQuality, getAirQuality,

  receiveDust,       getDust,

} = require('../Controllers/AirsensorController');
>>>>>>> 2ae796edc070db97a5c1dea88bf78fe17705f627


router.post('/dust',        receiveDust);
router.get('/dust',         getDust);


module.exports = router;