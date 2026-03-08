const SensorReading = require('../Models/HeatRiskSeonsor');

function calculateHeatIndex(temp_c, humidity) {

  const temp_f = temp_c * 9/5 + 32;

  const HI_F =
    -42.379 +
    2.04901523 * temp_f +
    10.14333127 * humidity -
    0.22475541 * temp_f * humidity -
    0.00683783 * (temp_f ** 2) -
    0.05481717 * (humidity ** 2) +
    0.00122874 * (temp_f ** 2) * humidity +
    0.00085282 * temp_f * (humidity ** 2) -
    0.00000199 * (temp_f ** 2) * (humidity ** 2);

  const HI_C = Math.round((HI_F - 32) * 5/9);

  return HI_C;
}

function classifyRisk(level) {

  if (level < 27) return "Normal";
  if (level < 33) return "Caution";
  if (level < 41) return "Extreme Caution";
  if (level < 51) return "Danger";

  return "Extreme Danger";
}


// POST /api/sensors
const receiveSensorData = async (req, res) => {

  try {

    const { device_id, temperature, humidity } = req.body;

    if (!device_id) {
      return res.status(400).json({ error: "device_id required" });
    }

    let heatIndex = null;
    let riskLevel = null;

    if (temperature != null && humidity != null) {

      heatIndex = calculateHeatIndex(temperature, humidity);
      riskLevel = classifyRisk(heatIndex);

    }

    const reading = await SensorReading.create({
      device_id,
      temperature,
      humidity,
      heat_index: heatIndex,
      risk_level: riskLevel
    });

    const wss = req.app.get('wss');

    if (wss) {

      wss.clients.forEach(client => {

        if (client.readyState === 1) {

          client.send(JSON.stringify({
            type: 'NEW_READING',
            data: reading
          }));

        }

      });

    }

    res.json({ success: true, id: reading.id });

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "Failed to save reading" });

  }

};


// GET /api/sensors
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


// GET /api/sensors/latest
const getLatestPerDevice = async (req, res) => {

  try {

    const { Op, literal } = require('sequelize');

    const readings = await SensorReading.findAll({
      where: {
        id: {
          [Op.in]: literal(`(
            SELECT MAX(id) FROM heat_risk_sensor_readings GROUP BY device_id
          )`),
        },
      },
    });

    res.json(readings);

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

};


module.exports = {
  receiveSensorData,
  getSensorReadings,
  getLatestPerDevice
};