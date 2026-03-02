const WaterLevel = require('../Models/WaterLevelSensor');

const receiveWaterLevel = async (req, res) => {
  try {
    const { device_id, water_level_mm } = req.body;

    if (!device_id) {
      return res.status(400).json({ error: 'device_id is required' });
    }

    const now = new Date();

    // Broadcast to WebSocket
    const wss = req.app.get('wss');
    if (wss) {
      wss.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            type: 'WATER_LEVEL',
            data: { device_id, water_level_mm, timestamp: now.toISOString() }
          }));
        }
      });
    }

    // Save to DB
    await WaterLevel.create({
      device_id,
      water_level_mm,
      recorded_at: now,
    });

    console.log(`[${device_id}] Water level: ${water_level_mm}mm saved`);
    res.json({ success: true });

  } catch (err) {
    console.error('Water level error:', err.message);
    res.status(500).json({ error: 'Failed to save water level' });
  }
};

const getWaterLevels = async (req, res) => {
  try {
    const levels = await WaterLevel.findAll({
      order: [['recorded_at', 'DESC']],
      limit: 100,
    });
    res.json(levels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getLatestLevel = async (req, res) => {
  try {
    const latest = await WaterLevel.findOne({
      order: [['recorded_at', 'DESC']],
    });
    res.json(latest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { receiveWaterLevel, getWaterLevels, getLatestLevel };