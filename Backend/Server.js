// app.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const CoralauthRoutes = require('./Routes/CoralUserRoute');
const ReportRoutes = require('./Routes/ReportRoute');
const stationReadingRoutes = require('./Routes/fstation.Rute');
require('dotenv').config();

const app = express();

// CORS configuration
app.use(cors({
    origin: 'http://localhost:3000', // Allow requests from your frontend
    credentials: true, // Allow cookies/credentials to be sent
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

app.use('/api/CoralauthRoutes', CoralauthRoutes);
app.use('/api/ReportRoutes', ReportRoutes);
app.use("/api/readings", stationReadingRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
