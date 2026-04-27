const AmoniaReading  = require('../Models/AmoniaReading');
const AirQuality     = require('../Models/Airquality');
const DustReading    = require('../Models/Dustreading');
const COReading      = require('../Models/COReading');
const Co2Reading     = require('../Models/Co2Reading');

// ───────────────────────────────
// 🔥 MEMORY BUFFERS (15 min batch)
// ───────────────────────────────
const gasBuffer = [];
const airBuffer = [];
const dustBuffer = [];
const coBuffer = [];
const co2Buffer = [];

// ───────────────────────────────
// ── GAS ────────────────────────
// ───────────────────────────────
const receiveGas = async (req, res) => {
  try {
    const { device_id, gas_ppm, voltage, raw_value, air_status } = req.body;

    const now = new Date();

    // 🔴 REAL-TIME WEB SOCKET (UNCHANGED)
    const wss = req.app.get('wss');
    if (wss) {
      wss.clients.forEach(c => {
        if (c.readyState === 1) {
          c.send(JSON.stringify({
            type: 'GAS_DATA',
            data: { device_id, gas_ppm, voltage, air_status, timestamp: now.toISOString() }
          }));
        }
      });
    }

    // 🟡 BUFFER INSTEAD OF DB SAVE
    gasBuffer.push({
      device_id,
      gas_ppm,
      voltage,
      raw_value,
      air_status,
      createdAt: now
    });

    console.log(`[${device_id}] Gas buffered`);

    res.json({ success: true });

  } catch (err) {
    console.error('Gas error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const getGas = async (req, res) => {
  try {
    const data = await AmoniaReading.findAll({
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ───────────────────────────────
// ── AIR QUALITY ────────────────
// ───────────────────────────────
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

    // BUFFER
    airBuffer.push({
      device_id,
      temperature,
      humidity,
      recorded_at: now
    });

    console.log(`[${device_id}] Air buffered`);

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

// ───────────────────────────────
// ── DUST ────────────────────────
// ───────────────────────────────
const receiveDust = async (req, res) => {
  try {
    const { device_id, dust_density, air_status } = req.body;
    const now = new Date();

    const wss = req.app.get('wss');
    if (wss) {
      wss.clients.forEach(c => {
        if (c.readyState === 1) {
          c.send(JSON.stringify({
            type: 'DUST_DATA',
            data: { device_id, dust_density, air_status, timestamp: now.toISOString() }
          }));
        }
      });
    }

    // BUFFER
    dustBuffer.push({
      device_id,
      dust_density,
      air_status,
      recorded_at: now
    });

    console.log(`[${device_id}] Dust buffered`);

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

// ───────────────────────────────
// ── CO ──────────────────────────
// ───────────────────────────────
const receiveCO = async (req, res) => {
  try {
    const { device_id, raw_value, voltage, co_value, status } = req.body;
    const now = new Date();

    const wss = req.app.get('wss');
    if (wss) {
      wss.clients.forEach(c => {
        if (c.readyState === 1) {
          c.send(JSON.stringify({
            type: 'CO_DATA',
            data: { device_id, raw_value, voltage, co_value, status, timestamp: now.toISOString() }
          }));
        }
      });
    }

    // BUFFER
    coBuffer.push({
      device_id,
      raw_value,
      voltage,
      co_value,
      status,
      recorded_at: now
    });

    console.log(`[${device_id}] CO buffered`);

    res.json({ success: true });

  } catch (err) {
    console.error('CO error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const getCO = async (req, res) => {
  try {
    const data = await COReading.findAll({
      order: [['recorded_at', 'DESC']],
      limit: 100
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ───────────────────────────────
// ── CO2 ─────────────────────────
// ───────────────────────────────
const receiveCo2 = async (req, res) => {
  try {
    const { device_id, aqi, tvoc, eco2, status } = req.body;
    const now = new Date();

    const wss = req.app.get('wss');
    if (wss) {
      wss.clients.forEach(c => {
        if (c.readyState === 1) {
          c.send(JSON.stringify({
            type: 'IAQ_DATA',
            data: { device_id, aqi, tvoc, eco2, status, timestamp: now.toISOString() }
          }));
        }
      });
    }

    // BUFFER
    co2Buffer.push({
      device_id,
      aqi,
      tvoc,
      eco2,
      status,
      recorded_at: now
    });

    console.log(`[${device_id}] CO2 buffered`);

    res.json({ success: true });

  } catch (err) {
    console.error('CO2 error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const getco2 = async (req, res) => {
  try {
    const data = await Co2Reading.findAll({
      order: [['recorded_at', 'DESC']],
      limit: 100
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ───────────────────────────────
// 🔥 15 MINUTE AUTO DATABASE SAVE
// ───────────────────────────────
setInterval(async () => {
  try {

    if (gasBuffer.length) {
      await AmoniaReading.bulkCreate(gasBuffer);
      gasBuffer.length = 0;
    }

    if (airBuffer.length) {
      await AirQuality.bulkCreate(airBuffer);
      airBuffer.length = 0;
    }

    if (dustBuffer.length) {
      await DustReading.bulkCreate(dustBuffer);
      dustBuffer.length = 0;
    }

    if (coBuffer.length) {
      await COReading.bulkCreate(coBuffer);
      coBuffer.length = 0;
    }

    if (co2Buffer.length) {
      await Co2Reading.bulkCreate(co2Buffer);
      co2Buffer.length = 0;
    }

    console.log("💾 15-minute batch saved to database");

  } catch (err) {
    console.error("Batch save error:", err.message);
  }
}, 15 * 60 * 1000);

// ───────────────────────────────
// EXPORT
// ───────────────────────────────
module.exports = {
  receiveGas,
  getGas,
  receiveAirQuality,
  getAirQuality,
  receiveDust,
  getDust,
  receiveCO,
  getCO,
  receiveCo2,
  getco2
};