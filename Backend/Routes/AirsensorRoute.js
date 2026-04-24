const express = require("express");
const router = express.Router();
const {
  getGas,
  getAirQuality,
  getDust,
  getCO,
  getco2,

  receiveGas,
  receiveAirQuality,
  receiveDust,
  receiveCO,
  receiveCo2
} = require("../Controllers/AirsensorController");

const {
  chatSensor,
  getUserByPhone,
  updateSubscription
} = require("../Controllers/ChatController");
const {
  createEmployee,
  getAllEmployees,
  sendOTP,
  verifyOTP
} = require("../Controllers/AiruserRegController");

router.post("/gas", receiveGas);
router.get("/gas", getGas);
router.post("/air-quality", receiveAirQuality);
router.get("/air-quality", getAirQuality);

router.post("/dust", receiveDust);
router.get("/dust", getDust);

// NEW MQ7
router.post("/co", receiveCO);
router.get("/co", getCO);

// NEW ENS160
router.post("/co2", receiveCo2);
router.get("/co2", getco2);

router.post("/chat", chatSensor);

router.post("/check", getUserByPhone);
router.post("/update", updateSubscription);

// Create
router.post("/sms", createEmployee);

// Get all
router.get("/employees", getAllEmployees);

router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);

module.exports = router;
