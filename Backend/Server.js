// app.js
const bodyParser = require('body-parser');

const cors = require('cors');
const http = require('http');                       
const { WebSocketServer } = require('ws');           

const CoralauthRoutes = require('./Routes/CoralUserRoute');

const ReportRoutes = require('./Routes/ReportRoute');
const sequelize = require('./Config/sequelize');

const sensorRoutes = require('./Routes/HeatSensorRoute.js'); 

require('./Models/FloodDangerAlert');            

require('./Models/WaterLevelSensor.js');    
const airSensorRoute = require('./Routes/AirsensorRoute.js');
const floodMeasurementRoute = require('./Routes/FloodMeasurementRoute');

require('./Models/GasReading.js');
require('./Models/TemSensor.js');
require('./Models/DustReading.js');  
require('./Models/FloodMeasurement.js');             // ← ADD

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


app.use('/api/pollution', Pollution);

app.use('/api/sensors', sensorRoutes);   

app.use('/api', airSensorRoute);
app.use('/api/flood', floodMeasurementRoute);



/* -------------------- DATABASE SYNC -------------------- */


///sequelize.sync({ alter: true })
 // .then(() => {
 //  console.log("✅ Database synced");
 //  });

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