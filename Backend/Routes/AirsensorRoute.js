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


module.exports = router;