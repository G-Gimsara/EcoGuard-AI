const FloodMeasurement = require("../Models/FloodMeasurement");
const FloatSensor = require('../Models/FloatSensor');
const { sendMajorCriticalFloodSms } = require("../Services/textlkFloodSms");


// Keep server-side flood levels aligned with ESP32 thresholds.
const levels = [
  { threshold: 0, name: "Normal", firstAffected: "No areas affected", nextAffected: "", floodFeet: 0 },
  { threshold: 40, name: "Alert", firstAffected: "Megoda Kolonnawa GND — 1 ft ankle-deep", nextAffected: "", floodFeet: 4 },
  { threshold: 75, name: "Minor", firstAffected: "Megoda Kolonnawa — 2 ft home entry\nWalpola GND Kaduwela — 1 ft yards", nextAffected: "", floodFeet: 5 },
  { threshold: 110, name: "Moderate", firstAffected: "Megoda Kolonnawa — 3-4 ft major homes\nWalpola — 2 ft roads", nextAffected: "Wellampitiya — 1 ft pooling\nKelanimulla GND Kolonnawa — 1-2 ft", floodFeet: 6.5 },
  { threshold: 145, name: "Major", firstAffected: "Megoda Kolonnawa — 4-6 ft evacuation\nWalpola — 3 ft households", nextAffected: "Wellampitiya — 2-3 ft\nKelaniya — 1-2 ft\nMahadeniya Kaduwela — 2 ft", floodFeet: 7 },
  { threshold: 180, name: "Critical", firstAffected: "Megoda Kolonnawa — 6-10 ft severe\nWalpola — 4-6 ft", nextAffected: "Wellampitiya/Kelaniya — 3-5 ft\nKaduwela DSD — 3-4 ft", floodFeet: 8 }
];

function getSeverity(riseLevel) {
  let severity = levels[0]; // fallback
  for (let i = 0; i < levels.length; i++) {
    if (riseLevel >= levels[i].threshold) severity = levels[i];
  }
  return severity;
}

// Create flood measurement, broadcast live, and trigger SMS on level transitions.
exports.createMeasurement = async (req, res) => {
  try {
    const { riseLevel } = req.body;

    if (riseLevel === undefined) {
      return res.status(400).json({ message: "riseLevel is required" });
    }

    const severityData = getSeverity(riseLevel);

    // Check previous severity so we only alert when level actually changes.
    const previous = await FloodMeasurement.findOne({
      // Stable ordering avoids incorrect "previous" reads when timestamps match closely.
      order: [["createdAt", "DESC"], ["id", "DESC"]],
      attributes: ["severity"],
    });
    const previousSeverity = previous ? previous.severity : null;

    const measurement = await FloodMeasurement.create({
      riseLevel,
      severity: severityData.name,
      firstAffected: severityData.firstAffected,
      nextAffected: severityData.nextAffected,
      floodFeet: severityData.floodFeet
    });

    // Push new reading to connected dashboards immediately.
    const wss = req.app.get('wss');
    if (wss) {
      wss.clients.forEach((client) => {
        if (client.readyState === 1) { // OPEN
          client.send(JSON.stringify({ type: "FLOOD_UPDATE", data: measurement }));
        }
      });
    }

    // Send SMS in background so API/websocket latency stays low.
    void sendMajorCriticalFloodSms({
      previousSeverity,
      currentSeverity: severityData.name,
      firstAffected: severityData.firstAffected || "",
      nextAffected: severityData.nextAffected || "",
    })
      .then((result) => {
        if (!result.skipped) {
          console.log(`[flood-sms] Delivery result: sent=${result.sent}, failed=${result.failed ?? 0}`);
        }
      })
      .catch((err) => console.error("[flood-sms]", err.message));

    return res.status(201).json(measurement);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Return flood history (newest first) for dashboard/report views.
exports.getMeasurements = async (req, res) => {
  try {
    // Include id as a tie-breaker so newest row is always first.
    const data = await FloodMeasurement.findAll({ order: [['createdAt', 'DESC'], ['id', 'DESC']] });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Receive float heartbeat/state updates and stream to websocket clients.
exports.receiveFloatStatus = async (req, res) => {
  try {
    const { device_id, status, message } = req.body;

    if (!device_id || !status) {
      return res.status(400).json({ error: 'device_id and status are required' });
    }

    const now = new Date();

    // Persist every status event; UI can decide how to summarize it.
    const row = await FloatSensor.create({
      device_id,
      status,
      message,
      recorded_at: now,
    });

    const wss = req.app.get('wss');
    if (wss) {
      const data = row.get({ plain: true });
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: 'FLOAT_UPDATE', data }));
        }
      });
    }

    console.log(`[${device_id}] Float status: ${status} saved`);
    res.json({ success: true });

  } catch (err) {
    console.error('Float sensor error:', err.message);
    res.status(500).json({ error: 'Failed to save float status' });
  }
};

// Return recent float status history (newest first).
exports.getFloatStatuses = async (req, res) => {
  try {
    const statuses = await FloatSensor.findAll({
      order: [['recorded_at', 'DESC']],
      limit: 100,
    });
    res.json(statuses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Return the latest single float status row.
exports.getLatestFloatStatus = async (req, res) => {
  try {
    const latest = await FloatSensor.findOne({
      order: [['recorded_at', 'DESC']],
    });
    res.json(latest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};