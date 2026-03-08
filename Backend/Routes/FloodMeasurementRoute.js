const express = require("express");
const router = express.Router();
const { createMeasurement, getMeasurements,receiveFloatStatus,getFloatStatuses,getLatestFloatStatus } = require("../Controllers/FloodController");

// POST /api/flood - add new measurement
router.post("/", createMeasurement);

// GET /api/flood - get all measurements
router.get("/", getMeasurements);

router.post('/float', receiveFloatStatus);
router.get('/float', getFloatStatuses);
router.get('/float/latest', getLatestFloatStatus);

module.exports = router;