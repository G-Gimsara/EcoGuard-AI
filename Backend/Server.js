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
const floodAlertRoute = require('./Routes/FloodMesureRoute.js'); // ← NOT CHANGED
require('./Models/FloodDangerAlert');            
const waterLevelRoute = require('./Routes/WaterLevelSensorRoute.js');
require('./Models/WaterLevelSensor.js');    
const airSensorRoute = require('./Routes/AirsensorRoute.js');
require('./Models/GasReading.js');

require('./Models/Airquality.js');            // ← ADD

require('./Models/Airquality.js');       
const waterQualityRoute = require('./Routes/WaterqualityRoute.js');
require('./Models/Phreading.js');
require('./Models/Tuberlity.js');
require('./Models/WaterTempReading.js');     // ← ADD


require('dotenv').config();




const authRoutes = require("./Routes/HeatAuthRouts.js");
const predictionsRoute = require("./Routes/heat_predictionRoutes.js");
const Pollution = require('./Routes/pollutionRoutes');



const express = require("express");
const dotenv = require("dotenv");


const { syncPredictions } = require("./Controllers/heat_controller.js");

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
app.set('wss', wss);

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

app.use('/api/pollution', Pollution);

app.use('/api/sensors', sensorRoutes);   
app.use('/api/float', floodAlertRoute);
app.use('/api/water-level', waterLevelRoute);
app.use('/api', airSensorRoute);

app.use('/api', waterQualityRoute);


/* -------------------- DATABASE SYNC -------------------- */


sequelize.sync({ alter: true })
  .then(() => {
    console.log("✅ Database synced");
  });

/* -------------------- SERVER START -------------------- */

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', async () => {       // ← ADD '0.0.0.0'
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌐 Network: http://10.180.188.181:${PORT}`);

  try {
    if (typeof syncPredictions === 'function') {
      await syncPredictions();
      console.log("✅ Predictions synced on startup");
    }
  } catch (err) {
    console.error("❌ Prediction sync failed:", err.message);
  }
});