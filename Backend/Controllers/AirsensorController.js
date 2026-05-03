const AmoniaReading  = require('../Models/AmoniaReading');
const AirQuality     = require('../Models/Airquality');
const DustReading    = require('../Models/Dustreading');
const COReading      = require('../Models/COReading');
const Co2Reading     = require('../Models/Co2Reading');

// ───────────────────────────────
// 🔥 MEMORY BUFFERS (2 min batch)
// ───────────────────────────────
const gasBuffer  = [];
const airBuffer  = [];
const dustBuffer = [];
const coBuffer   = [];
const co2Buffer  = [];

// ───────────────────────────────
// 🛠️ HELPER — Upsert into buffer
// ───────────────────────────────
const upsertBuffer = (buffer, device_id, newData) => {
  const index = buffer.findIndex(b => b.device_id === device_id);
  if (index !== -1) {
    buffer[index] = newData;   // REPLACE with latest
  } else {
    buffer.push(newData);      // First time, add it
  }
};


// ───────────────────────────────
// 🔥 GAS (Ammonia)
// ───────────────────────────────
const receiveGas = async (req, res) => {
  try {
    const { device_id, gas_ppm, voltage, raw_value, air_status } = req.body;
    const now = new Date();

    // ✅ WSS — real time (untouched)
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

    // ✅ Upsert — keep only latest per device
    upsertBuffer(gasBuffer, device_id, {
      device_id, gas_ppm, voltage, raw_value, air_status, createdAt: now
    });

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ───────────────────────────────
// 🌡️ AIR QUALITY
// ───────────────────────────────
const receiveAirQuality = async (req, res) => {
  try {
    const { device_id, temperature, humidity } = req.body;
    const now = new Date();

    // ✅ WSS
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

    // ✅ Upsert
    upsertBuffer(airBuffer, device_id, {
      device_id, temperature, humidity, recorded_at: now
    });

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ───────────────────────────────
// 🌪️ DUST
// ───────────────────────────────
const receiveDust = async (req, res) => {
  try {
    const { device_id, dust_density, air_status } = req.body;
    const now = new Date();

    // ✅ WSS
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

    // ✅ Upsert
    upsertBuffer(dustBuffer, device_id, {
      device_id, dust_density, air_status, recorded_at: now
    });

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ───────────────────────────────
// 🟤 CO
// ───────────────────────────────
const receiveCO = async (req, res) => {
  try {
    const { device_id, raw_value, voltage, co_value, status } = req.body;
    const now = new Date();

    // ✅ WSS
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

    // ✅ Upsert
    upsertBuffer(coBuffer, device_id, {
      device_id, raw_value, voltage, co_value, status, recorded_at: now
    });

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ───────────────────────────────
// 🟣 CO2 / IAQ
// ───────────────────────────────
const receiveCo2 = async (req, res) => {
  try {
    const { device_id, aqi, tvoc, eco2, status } = req.body;
    const now = new Date();

    // ✅ WSS
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

    // ✅ Upsert
    upsertBuffer(co2Buffer, device_id, {
      device_id, aqi, tvoc, eco2, status, recorded_at: now
    });

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ───────────────────────────────
// 💾 BATCH SAVE — 15 MIN PER SENSOR 15 * 60 * 1000;
// ───────────────────────────────
const FIFTEEN_MIN = 2 * 60 * 1000;

setInterval(async () => {
  if (!gasBuffer.length) return;
  try {
    await AmoniaReading.bulkCreate([...gasBuffer]);
    gasBuffer.length = 0;
    console.log("💾 Gas saved:", new Date().toISOString());
  } catch (err) {
    console.error("Gas save error:", err.message);
  }
}, FIFTEEN_MIN);

setInterval(async () => {
  if (!airBuffer.length) return;
  try {
    await AirQuality.bulkCreate([...airBuffer]);
    airBuffer.length = 0;
    console.log("💾 Air saved:", new Date().toISOString());
  } catch (err) {
    console.error("Air save error:", err.message);
  }
}, FIFTEEN_MIN);

setInterval(async () => {
  if (!dustBuffer.length) return;
  try {
    await DustReading.bulkCreate([...dustBuffer]);
    dustBuffer.length = 0;
    console.log("💾 Dust saved:", new Date().toISOString());
  } catch (err) {
    console.error("Dust save error:", err.message);
  }
}, FIFTEEN_MIN);

setInterval(async () => {
  if (!coBuffer.length) return;
  try {
    await COReading.bulkCreate([...coBuffer]);
    coBuffer.length = 0;
    console.log("💾 CO saved:", new Date().toISOString());
  } catch (err) {
    console.error("CO save error:", err.message);
  }
}, FIFTEEN_MIN);

setInterval(async () => {
  if (!co2Buffer.length) return;
  try {
    await Co2Reading.bulkCreate([...co2Buffer]);
    co2Buffer.length = 0;
    console.log("💾 CO2 saved:", new Date().toISOString());
  } catch (err) {
    console.error("CO2 save error:", err.message);
  }
}, FIFTEEN_MIN);


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