const PhReading        = require('../Models/Phreading');
const TurbidityReading = require('../Models/Tuberlity');
const WaterTempReading = require('../Models/WaterTempReading');

// ── pH ────────────────────────────────────
const receivePH = async (req, res) => {
  try {
    const { device_id, ph_value, ph_status } = req.body;
    const now = new Date();

    const wss = req.app.get('wss');
    if (wss) wss.clients.forEach(c => c.readyState === 1 && c.send(JSON.stringify({
      type: 'PH_DATA',
      data: { device_id, ph_value, ph_status, timestamp: now.toISOString() }
    })));

    await PhReading.create({ device_id, ph_value, ph_status, recorded_at: now });
    console.log(`[${device_id}] pH: ${ph_value} (${ph_status}) saved`);
    res.json({ success: true });
  } catch (err) {
    console.error('pH error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const getPH = async (req, res) => {
  try {
    const data = await PhReading.findAll({
      order: [['recorded_at', 'DESC']], limit: 100
    });
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Turbidity ─────────────────────────────
const receiveTurbidity = async (req, res) => {
  try {
    const { device_id, turbidity_ntu, turbidity_status, threshold_alert } = req.body;
    const now = new Date();

    const wss = req.app.get('wss');
    if (wss) wss.clients.forEach(c => c.readyState === 1 && c.send(JSON.stringify({
      type: 'TURBIDITY_DATA',
      data: { device_id, turbidity_ntu, turbidity_status, threshold_alert, timestamp: now.toISOString() }
    })));

    await TurbidityReading.create({
      device_id, turbidity_ntu, turbidity_status, threshold_alert, recorded_at: now
    });
    console.log(`[${device_id}] Turbidity: ${turbidity_ntu} NTU (${turbidity_status}) saved`);
    res.json({ success: true });
  } catch (err) {
    console.error('Turbidity error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const getTurbidity = async (req, res) => {
  try {
    const data = await TurbidityReading.findAll({
      order: [['recorded_at', 'DESC']], limit: 100
    });
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Water Temperature ─────────────────────
const receiveWaterTemp = async (req, res) => {
  try {
    const { device_id, temperature, temp_status } = req.body;
    const now = new Date();

    const wss = req.app.get('wss');
    if (wss) wss.clients.forEach(c => c.readyState === 1 && c.send(JSON.stringify({
      type: 'WATER_TEMP',
      data: { device_id, temperature, temp_status, timestamp: now.toISOString() }
    })));

    await WaterTempReading.create({ device_id, temperature, temp_status, recorded_at: now });
    console.log(`[${device_id}] Water Temp: ${temperature}C (${temp_status}) saved`);
    res.json({ success: true });
  } catch (err) {
    console.error('Water temp error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const getWaterTemp = async (req, res) => {
  try {
    const data = await WaterTempReading.findAll({
      order: [['recorded_at', 'DESC']], limit: 100
    });
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = {
  receivePH,        getPH,
  receiveTurbidity, getTurbidity,
  receiveWaterTemp, getWaterTemp,
};