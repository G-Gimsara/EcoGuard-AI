const express = require("express");
const router = express.Router();
const controller = require("../Controllers/polluController");

router.post("/add", controller.addPollutionData);
router.get("/area/:area", controller.getAreaPollution);
router.get("/all", controller.getAllPollutionData);
router.post("/chat", controller.chat);
module.exports = router;