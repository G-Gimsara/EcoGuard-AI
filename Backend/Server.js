// app.js
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');                       
const { WebSocketServer } = require('ws');           

const CoralauthRoutes = require('./Routes/CoralUserRoute');
const ReportRoutes = require('./Routes/ReportRoute');
const sequelize = require('./Config/sequelize');
const waterRoutes = require('./Routes/Wroute');
const sensorRoutes = require('./Routes/HeatSensorRoute.js'); // ← NEW

require('dotenv').config();

const express = require("express");
const dotenv = require("dotenv");
const authRoutes = require("./Routes/HeatAuthRouts.js");
const predictionsRoute = require("./Routes/heat_predictionRoutes.js");
const { syncPredictions } = require("./Controllers/heat_controller.js");

dotenv.config();

const app = express();
const server = http.createServer(app);               // ← NEW
const wss = new WebSocketServer({ server });         // ← NEW
app.set('wss', wss);                                 // ← NEW

/* -------------------- MIDDLEWARES -------------------- */

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

/* -------------------- WEBSOCKET -------------------- */

wss.on('connection', (ws) => {
  console.log('📡 IoT Dashboard client connected');
  ws.on('close', () => console.log('📡 IoT Dashboard client disconnected'));
});

/* -------------------- ROUTES -------------------- */

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
app.use('/api/sensors', sensorRoutes);               // ← NEW

/* -------------------- DATABASE SYNC -------------------- */

sequelize.sync({ alter: true })
  .then(() => {
    console.log("✅ Database synced");
  });

/* -------------------- SERVER START -------------------- */

const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {                    // ← CHANGED app.listen → server.listen
  console.log(`🚀 Server running on http://localhost:${PORT}`);

  try {
    if (typeof syncPredictions === 'function') {
      await syncPredictions();
      console.log("✅ Predictions synced on startup");
    }
  } catch (err) {
    console.error("❌ Prediction sync failed:", err.message);
  }
});