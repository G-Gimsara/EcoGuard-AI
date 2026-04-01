const GasReading  = require('../Models/GasReading');
const AirQuality  = require('../Models/Airquality');
const DustReading = require('../Models/Dustreading');

// ── Gas ───────────────────────────────────
const receiveGas = async (req, res) => {
  try {
    const { device_id, gas_ppm, voltage, raw_value } = req.body;
    const now = new Date();

    const wss = req.app.get('wss');
    if (wss) {
      wss.clients.forEach(c => {
        if (c.readyState === 1) {
          c.send(JSON.stringify({
            type: 'GAS_DATA',
            data: { device_id, gas_ppm, voltage, timestamp: now.toISOString() }
          }));
        }
      });
    }

    await GasReading.create({
      device_id,
      gas_ppm,
      voltage,
      raw_value,
      recorded_at: now
    });

    console.log(`[${device_id}] Gas: ${gas_ppm} PPM saved`);
    res.json({ success: true });

  } catch (err) {
    console.error('Gas error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const getGas = async (req, res) => {
  try {
    const data = await GasReading.findAll({
      order: [['recorded_at', 'DESC']],
      limit: 100
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Air Quality ───────────────────────────
const receiveAirQuality = async (req, res) => {
  try {
    const { device_id, temperature, humidity } = req.body;
    const now = new Date();

    const wss = req.app.get('wss');
    if (wss) {
      wss.clients.forEach(c => {
        if (c.readyState === 1) {
          c.send(JSON.stringify({
            type: 'AIR_QUALITY',
            data: { device_id, temperature, humidity, timestamp: now.toISOString() }
          }));
        }
      });
    }

    await AirQuality.create({
      device_id,
      temperature,
      humidity,
      recorded_at: now
    });

    console.log(`[${device_id}] Temp: ${temperature}C Hum: ${humidity}% saved`);
    res.json({ success: true });

  } catch (err) {
    console.error('Air quality error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const getAirQuality = async (req, res) => {
  try {
    const data = await AirQuality.findAll({
      order: [['recorded_at', 'DESC']],
      limit: 100
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Dust ──────────────────────────────────
const receiveDust = async (req, res) => {
  try {
    const { device_id, dust_density } = req.body;
    const now = new Date();

    const wss = req.app.get('wss');
    if (wss) {
      wss.clients.forEach(c => {
        if (c.readyState === 1) {
          c.send(JSON.stringify({
            type: 'DUST_DATA',
            data: { device_id, dust_density, timestamp: now.toISOString() }
          }));
        }
      });
    }

    await DustReading.create({
      device_id,
      dust_density,
      recorded_at: now
    });

    console.log(`[${device_id}] Dust: ${dust_density} ug/m3 saved`);
    res.json({ success: true });

  } catch (err) {
    console.error('Dust error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const getDust = async (req, res) => {
  try {
    const data = await DustReading.findAll({
      order: [['recorded_at', 'DESC']],
      limit: 100
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Export Controllers ────────────────────
module.exports = {
  receiveGas,
  getGas,
  receiveAirQuality,
  getAirQuality,
  receiveDust,
  getDust
};