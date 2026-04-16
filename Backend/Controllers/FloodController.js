const FloodMeasurement = require("../Models/FloodMeasurement");
const FloatSensor = require('../Models/FloatSensor');

// --- SMS (START): Major/Critical flood SMS — DISABLED (textlkFloodSms.js is comment-only) ---
// const { sendMajorCriticalFloodSms } = require("../Services/textlkFloodSms");
// --- SMS (END) ---

// Define thresholds same as your ESP32 logic
const levels = [
  { threshold: 0, name: "Normal", firstAffected: "No areas affected", nextAffected: "", floodFeet: 0 },
  { threshold: 40, name: "Alert", firstAffected: "Megoda Kolonnawa GND — 1 ft ankle-deep", nextAffected: "", floodFeet: 4 },
  { threshold: 75, name: "Minor", firstAffected: "Megoda Kolonnawa — 2 ft home entry\nWalpola GND Kaduwela — 1 ft yards", nextAffected: "", floodFeet: 5 },
  { threshold: 110, name: "Moderate", firstAffected: "Megoda Kolonnawa — 3-4 ft major homes\nWalpola — 2 ft roads", nextAffected: "Wellampitiya — 1 ft pooling\nKelanimulla GND Kolonnawa — 1-2 ft", floodFeet: 6.5 },
  { threshold: 145, name: "Major", firstAffected: "Megoda Kolonnawa — 4-6 ft evacuation\nWalpola — 3 ft households", nextAffected: "Wellampitiya — 2-3 ft\nKelaniya — 1-2 ft\nMahadeniya Kaduwela — 2 ft", floodFeet: 7 },
  { threshold: 180, name: "Critical", firstAffected: "Megoda Kolonnawa — 6-10 ft severe\nWalpola — 4-6 ft", nextAffected: "Wellampitiya/Kelaniya — 3-5 ft\nKaduwela DSD — 3-4 ft", floodFeet: 8 }
];

function getSeverity(riseLevel) {
  let severity = levels[0]; // default to Normal
  for (let i = 0; i < levels.length; i++) {
    if (riseLevel >= levels[i].threshold) severity = levels[i];
  }
  return severity;
}

exports.createMeasurement = async (req, res) => {
  try {
    const { riseLevel } = req.body;

    if (riseLevel === undefined) {
      return res.status(400).json({ message: "riseLevel is required" });
    }

    const severityData = getSeverity(riseLevel);

    // --- SMS (START): previous row for anti-spam transition logic — DISABLED ---
    // const previous = await FloodMeasurement.findOne({
    //   order: [["createdAt", "DESC"]],
    //   attributes: ["severity"],
    // });
    // const previousSeverity = previous ? previous.severity : null;
    // --- SMS (END) ---

    const measurement = await FloodMeasurement.create({
      riseLevel,
      severity: severityData.name,
      firstAffected: severityData.firstAffected,
      nextAffected: severityData.nextAffected,
      floodFeet: severityData.floodFeet
    });

    // --- BROADCAST VIA WEBSOCKET ---
    const wss = req.app.get('wss');
    if (wss) {
      wss.clients.forEach((client) => {
        if (client.readyState === 1) { // OPEN
          client.send(JSON.stringify({ type: "FLOOD_UPDATE", data: measurement }));
        }
      });
    }

    // --- SMS (START): background Text.lk send — DISABLED ---
    // void sendMajorCriticalFloodSms({
    //   previousSeverity,
    //   currentSeverity: severityData.name,
    //   riseLevel,
    // })
    //   .then((result) => {
    //     if (!result.skipped) {
    //       console.log(`[flood-sms] Delivery result: sent=${result.sent}, failed=${result.failed ?? 0}`);
    //     }
    //   })
    //   .catch((err) => console.error("[flood-sms]", err));
    // --- SMS (END) ---

    return res.status(201).json(measurement);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getMeasurements = async (req, res) => {
  try {
    const data = await FloodMeasurement.findAll({ order: [['createdAt', 'DESC']] });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.receiveFloatStatus = async (req, res) => {
  try {
    const { device_id, status, message } = req.body;

    if (!device_id || !status) {
      return res.status(400).json({ error: 'device_id and status are required' });
    }

    const now = new Date();

    // Broadcast to WebSocket (if you want real-time updates)
    const wss = req.app.get('wss');
    if (wss) {
      wss.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            type: 'FLOAT_UPDATE',
            data: { device_id, status, message, timestamp: now.toISOString() }
          }));
        }
      });
    }

    // Save to DB
    await FloatSensor.create({
      device_id,
      status,
      message,
      recorded_at: now,
    });

    console.log(`[${device_id}] Float status: ${status} saved`);
    res.json({ success: true });

  } catch (err) {
    console.error('Float sensor error:', err.message);
    res.status(500).json({ error: 'Failed to save float status' });
  }
};

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