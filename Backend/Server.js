
// app.js
const bodyParser = require('body-parser');

const cors = require('cors');
const http = require('http');                       
const { WebSocketServer } = require('ws');           

const CoralauthRoutes = require('./Routes/CoralUserRoute');

const ReportRoutes = require('./Routes/ReportRoute');
const sequelize = require('./Config/sequelize');
const waterRoutes = require('./Routes/Wroute');
const sensorRoutes = require('./Routes/HeatSensorRoute.js'); 
// ========================= FLOOD MODULE (imports) — START =========================
// Router: measurements + float sensor (FloodController). Mounted later as /api/flood and /api/float.
const floodAlertRoute = require('./Routes/FloodMesureRoute.js');
// Model: legacy / parallel flood danger alerts table (synced with sequelize).
require('./Models/FloodDangerAlert.js');
// ========================= FLOOD MODULE (imports) — END ===========================
require('./Models/WaterLevelSensor.js');    
const airSensorRoute = require('./Routes/AirsensorRoute.js');
require('./Models/GasReading.js');

require('./Models/Airquality.js');            // ← ADD

require('./Models/Airquality.js');       
const waterQualityRoute = require('./Routes/WaterqualityRoute.js');
// ========================= FLOOD MODULE (SMS subscribers route) — START =========================
// FloodAlertUserController: register/list/PATCH subscription for Text.lk flood SMS recipients.
const floodAlertUserRoute = require("./Routes/FloodAlertUserRoute");
// ========================= FLOOD MODULE (SMS subscribers route) — END ===========================
require('./Models/Phreading.js');
require('./Models/Tuberlity.js');
require('./Models/WaterTempReading.js');     // ← ADD
const heatAlertRoutes = require('./Routes/heatAlertRoutes');


require('dotenv').config();

const authRoutes = require("./Routes/HeatAuthRouts.js");
const predictionsRoute = require("./Routes/heat_predictionRoutes.js");
const Pollution = require('./Routes/pollutionRoutes');

const express = require("express");
const dotenv = require("dotenv");

const { syncPredictions } = require("./Controllers/heat_controller.js");

// ────────────────────────────────────────────────
// NEW: Heat alert cache & background refresh
const { getHeatWarning, getRawDangerData } = require('./Controllers/HeatAlertController');

// In-memory cache
let cachedWarning = null;
let lastDangerSignature = null;
let lastRefreshTime = 0;
const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

// Helper: create signature to detect meaningful changes
function getDangerSignature(dangerData) {
  if (!dangerData || dangerData.length === 0) return 'empty';
  return dangerData
    .map(d => `${d.location.toLowerCase()}|${d.datetime.split('T')[0]}|${Math.round(d.heat_index_C || 0)}`)
    .sort()
    .join('||');
}

// Background refresh job
async function refreshHeatWarning() {
  console.log('[HeatCache] Refresh started...');
  try {
    const dangerData = await getRawDangerData();
    const currentSignature = getDangerSignature(dangerData);

    // Only regenerate if danger set changed
    const needsRegenerate = !lastDangerSignature || lastDangerSignature !== currentSignature;

    if (!needsRegenerate && cachedWarning) {
      console.log('[HeatCache] No significant change → keeping existing warning');
      lastRefreshTime = Date.now();
      return;
    }

    console.log('[HeatCache] Changes detected → regenerating warning');

    const fakeReq = {};
    const fakeRes = {
      json: (data) => { cachedWarning = data; },
      status: (code) => ({ json: (err) => console.error('[HeatCache] Error:', err) })
    };

    await getHeatWarning(fakeReq, fakeRes);
    lastDangerSignature = currentSignature;
    lastRefreshTime = Date.now();

    console.log('[HeatCache] Refresh completed');
  } catch (err) {
    console.error('[HeatCache] Refresh failed:', err.message);
  }
}

// Start the cycle
setInterval(refreshHeatWarning, REFRESH_INTERVAL_MS);
// Run once at startup
refreshHeatWarning();

// ────────────────────────────────────────────────




dotenv.config();



// const waterLevelRoute = require("./Routes/WaterLevelSensorRoute.js"); 



/* -------------------- MODELS -------------------- */
// ========================= FLOOD MODULE (DB models for sync) — START =========================
require("./Models/FloodDangerAlert.js");
require("./Models/FloodAlertUser.js");
// ========================= FLOOD MODULE (DB models for sync) — END ===========================
require("./Models/WaterLevelSensor.js");
require("./Models/GasReading.js");
require("./Models/Airquality.js");
require("./Models/Phreading.js");
require("./Models/Tuberlity.js");
require("./Models/WaterTempReading.js");

/* -------------------- CONTROLLERS -------------------- */
// Fixed: Matches heat_controller.js


/* -------------------- APP INIT -------------------- */
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
// ========================= FLOOD MODULE (WebSocket) — START =========================
// FloodController uses req.app.get("wss") to push FLOOD_UPDATE / FLOAT_UPDATE to EcoGuard Flood_Risk UI.
app.set("wss", wss);
// ========================= FLOOD MODULE (WebSocket) — END ===========================

/* -------------------- MIDDLEWARE -------------------- */
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

/* -------------------- WEBSOCKET -------------------- */
wss.on("connection", (ws) => {
  console.log("📡 IoT Dashboard client connected");
  ws.on("close", () => console.log("📡 IoT Dashboard client disconnected"));
});

/* -------------------- API ROUTES -------------------- */
app.get("/", (req, res) => {
  res.json({ message: "🚀 Backend API running (CommonJS Mode)" });
});

app.use("/api/coral-auth", CoralauthRoutes);
app.use("/api/reports", ReportRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/predictions", predictionsRoute);

app.use('/api/CoralauthRoutes', CoralauthRoutes);
app.use('/api/ReportRoutes', ReportRoutes);
app.use('/api/water', waterRoutes);

app.use('/api/pollution', Pollution);

app.use('/api/sensors', sensorRoutes);   
// ========================= FLOOD MODULE: /api/float — START =========================
// FloodMesureRoute — float sensor ingest + list (same controller as under /api/flood/float).
app.use('/api/float', floodAlertRoute);
// ========================= FLOOD MODULE: /api/float — END ===========================

app.use('/api', airSensorRoute);

app.use('/api', waterQualityRoute);
app.use('/api', heatAlertRoutes);
// ========================= FLOOD MODULE: /api/alert-users — START =========================
// FloodAlertUserRoute — register phone for Major/Critical SMS (Text.lk); CORS includes PATCH for Register UI.
app.use("/api/alert-users", floodAlertUserRoute);
// ========================= FLOOD MODULE: /api/alert-users — END ===========================

// ────────────────────────────────────────────────
// UPDATED: Heat warning route with cache support
app.get('/api/heat-warning', async (req, res) => {
  const ageMinutes = (Date.now() - lastRefreshTime) / 60000;

  if (cachedWarning && ageMinutes < 12) {
    console.log(`[HeatCache] Serving cached result (age: ${ageMinutes.toFixed(1)} min)`);
    return res.json(cachedWarning);
  }

  console.log('[HeatCache] Cache stale → generating fresh');
  await getHeatWarning(req, res);
});

/* -------------------- DATABASE SYNC -------------------- */


app.use("/api/water", waterRoutes);
app.use("/api/pollution", Pollution);
app.use("/api/sensors", sensorRoutes);
// ========================= FLOOD MODULE: /api/flood — START =========================
// FloodMesureRoute — POST new rise reading (triggers WS FLOOD_UPDATE + optional SMS), GET measurement history.
app.use("/api/flood", floodAlertRoute);
// ========================= FLOOD MODULE: /api/flood — END ===========================
// app.use("/api/water-level", waterLevelRoute); // Commented out until file is created
app.use("/api/air", airSensorRoute);
app.use("/api/water-quality", waterQualityRoute);

/* -------------------- DATABASE SYNC -------------------- */

sequelize.sync({ alter: true })
  .then(() => {
    console.log("✅ Database synced");
  })
  .catch((err) => {
    console.error("❌ Database sync error:", err);
  });

/* -------------------- SERVER START -------------------- */
const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", async () => {

  console.log(`🚀 Server running: http://localhost:${PORT}`);
  console.log(`🌐 Network: http://10.180.188.181:${PORT}`);

  try {

    if (typeof syncPredictions === "function") {
      await syncPredictions();
      console.log("✅ Predictions synced");
    }

  } catch (err) {
    console.error("❌ Prediction sync failed:", err.message);
  }

});