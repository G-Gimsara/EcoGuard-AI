const FloodAlert = require('../Models/FloodDangerAlert');

const receiveFloatStatus = async (req, res) => {
  try {
    const { device_id, status, message } = req.body;

    if (!device_id) {
      return res.status(400).json({ error: 'device_id is required' });
    }

    const now = new Date();

    // Always broadcast to WebSocket
    const wss = req.app.get('wss');
    if (wss) {
      wss.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            type: 'FLOAT_STATUS',
            data: { device_id, status, message, timestamp: now.toISOString() }
          }));
        }
      });
    }

    // Check last saved status for this device
    const lastRecord = await FloodAlert.findOne({
      where: { device_id },
      order: [['recorded_at', 'DESC']],
    });

    // Only save if status changed from last saved record
    if (!lastRecord || lastRecord.status !== status) {
      await FloodAlert.create({
        device_id,
        status,
        message,
        recorded_at: now,
      });
      console.log(`[${device_id}] ${status} saved at ${now.toLocaleString()}`);
    } else {
      console.log(`[${device_id}] ${status} - no change, skipped`);
    }

    res.json({ success: true });

  } catch (err) {
    console.error('Float error:', err.message);
    res.status(500).json({ error: 'Failed to process float status' });
  }
};

const getAlerts = async (req, res) => {
  try {
    const alerts = await FloodAlert.findAll({
      order: [['recorded_at', 'DESC']],
      limit: 100,
    });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getLatestStatus = async (req, res) => {
  try {
    const { Op, literal } = require('sequelize');
    const latest = await FloodAlert.findAll({
      where: {
        id: {
          [Op.in]: literal(`(SELECT MAX(id) FROM flood_alerts GROUP BY device_id)`)
        }
      }
    });
    res.json(latest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



module.exports = { receiveFloatStatus, getAlerts, getLatestStatus };