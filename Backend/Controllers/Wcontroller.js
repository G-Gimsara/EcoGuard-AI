const Report = require('../Models/Waterlevel');
// controllers/floodController.js
const FloodAlert = require('../Models/FloodAearalrert');

// Categorize based on ranges
function categorizeLevel(value, type) {
    if(type === 'water') {
        if(value < 2) return 'low';
        else if(value < 5) return 'medium';
        else return 'high';
    } else if(type === 'rainfall') {
        if(value < 10) return 'low';
        else if(value < 50) return 'medium';
        else return 'high';
    }
}

// Save new report
exports.createReport = async (req, res) => {
    try {
        const { station, waterLevel, rainfallLevel, latitude, longitude } = req.body;

        if (!station || waterLevel === undefined || rainfallLevel === undefined || !latitude || !longitude) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const report = await Report.create({
            station,
            waterLevel,
            rainfallLevel,
            latitude,
            longitude
        });

        // Add categories
        const response = {
            ...report.toJSON(),
            waterLevelCategory: categorizeLevel(waterLevel, 'water'),
            rainfallLevelCategory: categorizeLevel(rainfallLevel, 'rainfall')
        };

        res.status(201).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get all reports
exports.getReports = async (req, res) => {
    try {
        const reports = await Report.findAll();

        const response = reports.map(r => {
            return {
                ...r.toJSON(),
                waterLevelCategory: categorizeLevel(r.waterLevel, 'water'),
                rainfallLevelCategory: categorizeLevel(r.rainfallLevel, 'rainfall')
            };
        });

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};




// Create a new alert
exports.createFloodAlert = async (req, res) => {
    try {
        const { river_rise, alert_level, first_affected, next_affected, further_affected, widespread_zones } = req.body;

        const alert = await FloodAlert.create({
            river_rise,
            alert_level,
            first_affected,
            next_affected,
            further_affected,
            widespread_zones
        });

        res.status(201).json(alert);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// Get all alerts
exports.getAllFloodAlerts = async (req, res) => {
    try {
        const alerts = await FloodAlert.findAll({ order: [['id', 'ASC']] });
        res.json(alerts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// Get alert by ID
exports.getFloodAlertById = async (req, res) => {
    try {
        const alert = await FloodAlert.findByPk(req.params.id);
        if (!alert) return res.status(404).json({ message: "Alert not found" });
        res.json(alert);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};