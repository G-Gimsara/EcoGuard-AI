// Routes/heatAlertRoutes.js
const express = require('express');
const router = express.Router();

const { getHeatWarning } = require('../Controllers/HeatAlertController');

router.get('/heat-warning', getHeatWarning);

module.exports = router;