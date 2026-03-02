const SensorReading = require('../Models/HeatRiskSeonsor');

// Called by ESP32 → POST /api/sensors
const receiveSensorData = async (req, res) => {
  try {
    const { device_id, temperature, humidity, voltage, ...rest } = req.body;

    if (!device_id) {
      return res.status(400).json({ error: 'device_id is required' });
    }

    const reading = await SensorReading.create({
      device_id,
      temperature:  temperature ?? null,
      humidity:     humidity    ?? null,
      voltage:      voltage     ?? null,
      raw_data:     Object.keys(rest).length ? rest : null,
    });

    // Broadcast to WebSocket clients (dashboard)
    const wss = req.app.get('wss');
    if (wss) {
      wss.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: 'NEW_READING', data: reading }));
        }
      });
    }

    res.json({ success: true, id: reading.id });
  } catch (err) {
    console.error('Sensor save error:', err.message);
    res.status(500).json({ error: 'Failed to save reading' });
  }
};

// GET /api/sensors?device_id=xxx&limit=50
const getSensorReadings = async (req, res) => {
  try {
    const { device_id, limit = 50 } = req.query;
    const where = device_id ? { device_id } : {};

    const readings = await SensorReading.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
    });

    res.json(readings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/sensors/latest — latest reading per device
const getLatestPerDevice = async (req, res) => {
  try {
    const { Op, fn, col, literal } = require('sequelize');

    const readings = await SensorReading.findAll({
      where: {
        id: {
          [Op.in]: literal(`(
            SELECT MAX(id) FROM sensor_readings GROUP BY device_id
          )`),
        },
      },
    });

    res.json(readings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { receiveSensorData, getSensorReadings, getLatestPerDevice };