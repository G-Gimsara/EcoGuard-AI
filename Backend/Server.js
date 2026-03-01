
// app.js
const express = require('express');
const bodyParser = require('body-parser');


const ReportRoutes = require('./Routes/ReportRoute');
const sequelize = require('./Config/sequelize');
const waterRoutes = require('./Routes/Wroute');

require('dotenv').config();


const cors = require("cors");
const dotenv = require("dotenv");


const CoralauthRoutes = require("./Routes/CoralUserRoute.js");

const authRoutes = require("./Routes/HeatAuthRouts.js");
const predictionsRoute = require("./Routes/heat_predictionRoutes.js");
const Pollution = require('./Routes/pollutionRoutes');


const { syncPredictions } = require("./Controllers/heat_controller.js");

dotenv.config();


const app = express();

/* -------------------- MIDDLEWARES -------------------- */

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

/* -------------------- ROUTES -------------------- */

app.get("/", (req, res) => {
  res.json({ message: "🚀 Backend API running (CommonJS Mode)" });
});

app.use("/api/coral-auth", CoralauthRoutes);
app.use("/api/reports", ReportRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/predictions", predictionsRoute);

/* -------------------- SERVER START -------------------- */

app.use('/api/CoralauthRoutes', CoralauthRoutes);
app.use('/api/ReportRoutes', ReportRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/pollution', Pollution);

sequelize.sync({ alter: true })
  .then(() => {
   console.log("Database synced");
 });
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);

  // Auto sync predictions
  try {
    if (typeof syncPredictions === 'function') {
      await syncPredictions();
      console.log("✅ Predictions synced on startup");
    }
  } catch (err) {
    console.error("❌ Prediction sync failed:", err.message);
  }
});