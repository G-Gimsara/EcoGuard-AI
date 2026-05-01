const FloodAlert = require('../Models/FloodDangerAlert');

// Ingest float sensor state, broadcast it live, and persist only meaningful changes.
const receiveFloatStatus = async (req, res) => {
  try {
    const { device_id, status, message } = req.body;

    if (!device_id) {
      return res.status(400).json({ error: 'device_id is required' });
    }

    const now = new Date();

    // Push every incoming status to websocket clients for real-time UI updates.
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

    // Read the latest DB row for this device to detect duplicate state.
    const lastRecord = await FloodAlert.findOne({
      where: { device_id },
      order: [['recorded_at', 'DESC']],
    });

    // Store a new record only when status actually changes.
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

// Return recent float alert history (newest first) for dashboard tables.
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

// Return one latest row per device using grouped MAX(id) subquery.
const getLatestStatus = async (req, res) => {
  try {
    // Imported here to keep module load lightweight for non-query paths.
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