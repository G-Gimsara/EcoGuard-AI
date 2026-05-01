const express = require("express");
const router = express.Router();
const { createMeasurement, getMeasurements,receiveFloatStatus,getFloatStatuses,getLatestFloatStatus } = require("../Controllers/FloodController");

// Create a new flood measurement event.
router.post("/", createMeasurement);

// Fetch flood measurement history (newest first).
router.get("/", getMeasurements);

// Float sensor status ingestion + history endpoints.
router.post('/float', receiveFloatStatus);
router.get('/float', getFloatStatuses);
router.get('/float/latest', getLatestFloatStatus);

module.exports = router;