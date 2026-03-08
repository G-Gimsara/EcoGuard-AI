const express = require("express");
const cors = require("cors");
const http = require("http");
const { WebSocketServer } = require("ws");
const dotenv = require("dotenv");
const sequelize = require("./Config/sequelize");

dotenv.config();

/* -------------------- ROUTES -------------------- */
const CoralauthRoutes = require("./Routes/CoralUserRoute");
const ReportRoutes = require("./Routes/ReportRoute");
const waterRoutes = require("./Routes/Wroute"); // Fixed: Matches Wroute.js
const sensorRoutes = require("./Routes/HeatSensorRoute.js");
const floodAlertRoute = require("./Routes/FloodMesureRoute.js");


// const waterLevelRoute = require("./Routes/WaterLevelSensorRoute.js"); 

const airSensorRoute = require("./Routes/AirsensorRoute.js");
const waterQualityRoute = require("./Routes/WaterqualityRoute.js");

const authRoutes = require("./Routes/HeatAuthRouts.js"); // Fixed: Matches HeatAuthRouts.js
const predictionsRoute = require("./Routes/heat_predictionRoutes.js");
const Pollution = require("./Routes/pollutionRoutes.js"); // Added .js for consistency

/* -------------------- MODELS -------------------- */
require("./Models/FloodDangerAlert.js");
require("./Models/WaterLevelSensor.js");
require("./Models/GasReading.js");
require("./Models/Airquality.js");
require("./Models/Phreading.js");
require("./Models/Tuberlity.js");
require("./Models/WaterTempReading.js");

/* -------------------- CONTROLLERS -------------------- */
// Fixed: Matches heat_controller.js
const { syncPredictions } = require("./Controllers/heat_controller.js"); 

/* -------------------- APP INIT -------------------- */
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
app.set("wss", wss);

/* -------------------- MIDDLEWARE -------------------- */
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
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
app.use("/api/water", waterRoutes);
app.use("/api/pollution", Pollution);
app.use("/api/sensors", sensorRoutes);
app.use("/api/float", floodAlertRoute);
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
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌐 Network: http://10.180.188.181:${PORT}`);

  try {
    if (typeof syncPredictions === "function") {
      await syncPredictions();
      console.log("✅ Predictions synced on startup");
    }
  } catch (err) {
    console.error("❌ Prediction sync failed:", err.message);
  }
});