/* import express from "express";
import * as predController from "../Controllers/heat_controller.js";

const router = express.Router();

router.post("/sync", predController.syncPredictions);
router.get("/", predController.getAllPredictions);
router.get("/today-map", predController.getTodayMap);

// Simple health check
router.get("/test", (req, res) => res.json({ success: true }));

export default router; */

const express = require("express");
const predController = require("../Controllers/heat_controller.js");

const router = express.Router();

router.post("/sync", predController.syncPredictions);
router.get("/", predController.getAllPredictions);
router.get("/today-map", predController.getTodayMap);

// Simple health check
router.get("/test", (req, res) => res.json({ success: true }));


module.exports = router;