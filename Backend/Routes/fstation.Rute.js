const express = require("express");
const router = express.Router();

const stationReadingController = require(
  "../Controllers/Fwarningcontroller"
);

// POST from IoT device
router.post("/", stationReadingController.createReading);

// GET latest reading for station
router.get("/latest/:station_id", stationReadingController.getLatestByStation);

// GET historical readings
router.get("/:station_id", stationReadingController.getHistory);

//flood auth

router.post("/register", floodCtrl.registerSubscriber);

module.exports = router;
