const SensorReading = require('../Models/HeatRiskSeonsor');
const axios = require("axios");
const HeatAlertSubscriber = require("../Models/HeatAlertSubscriber");

const lastAlertState = {};
// Format:
// {
//   device_id: {
//     riskLevel: "Danger" | "Extreme Danger",
//     timestamp: number
//   }
// }

const ALERT_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

const TEXTLK_API_URL = process.env.TEXTLK_API_URL || "https://app.text.lk/api/v3/sms/send";
const TEXTLK_API_KEY = process.env.TEXTLK_API_KEY || "";
const TEXTLK_SENDER_ID = process.env.TEXTLK_SENDER_ID || "TextLKDemo";

if (!TEXTLK_API_KEY) {
  console.warn("[HeatRiskSensor] TEXTLK_API_KEY is not set. SMS dispatch is disabled.");
}

function normalizePhone(value = "") {
  const digits = String(value).replace(/[^\d]/g, "");
  if (digits.startsWith("94")) return digits;
  if (digits.startsWith("0")) return `94${digits.slice(1)}`;
  return digits;
}

function buildLiveSensorSms(temperature, heatIndex, riskLevel) {
  const location = "Kaduwela"; // Assuming Kaduwela for now, can be made dynamic later
  const riskText = riskLevel === "Extreme Danger" ? "Extreme Danger" : "Danger";
  const heatText = riskLevel === "Extreme Danger" ? "Extreme heat" : "High heat";
  const riskDescription = riskLevel === "Extreme Danger" ? "Heat stroke likely." : "Heat exhaustion possible.";

  return `EcoGuard Alert: ${location}
${heatText} detected NOW!
Air Temperature: ${temperature}°C
You feel like: ${heatIndex}°C
Risk Level: ${riskText}

Risk: ${riskDescription}

Immediate Actions:
- Avoid outdoor activity
- Drink plenty of water

Stay safe.`;
}

async function sendLiveSensorAlert(temperature, heatIndex, riskLevel) {
  if (!TEXTLK_API_KEY) {
    console.log("[HeatRiskSensor] SMS skipped: TEXTLK_API_KEY not configured.");
    return;
  }

  try {
    const subscribers = await HeatAlertSubscriber.findAll({
      where: { isActive: true },
      attributes: ["mobile"],
    });

    const recipients = Array.from(
      new Set(
        subscribers
          .map((subscriber) => normalizePhone(subscriber.mobile))
          .filter((phone) => /^94\d{9}$/.test(phone))
      )
    );

    if (recipients.length === 0) {
      console.log("[HeatRiskSensor] No active SMS subscribers found.");
      return;
    }

    const message = buildLiveSensorSms(temperature, heatIndex, riskLevel);

    await axios.post(
      TEXTLK_API_URL,
      {
        recipient: recipients.join(","),
        sender_id: TEXTLK_SENDER_ID,
        type: "plain",
        message,
      },
      {
        headers: {
          Authorization: `Bearer ${TEXTLK_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    console.log(`[HeatRiskSensor] SMS sent to ${recipients.length} subscriber(s) for live sensor alert`);
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.error("[HeatRiskSensor] Failed to send SMS via Text.lk:", status || "", data || err.message);
  }
}

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

function shouldSendAlert(deviceId, riskLevel) {

  if (riskLevel !== "Danger" && riskLevel !== "Extreme Danger") {
    return false;
  }

  const now = Date.now();
  const last = lastAlertState[deviceId];

  // First alert
  if (!last) {
    lastAlertState[deviceId] = { riskLevel, timestamp: now };
    return true;
  }

  // Escalation (Danger -> Extreme Danger)
  if (last.riskLevel === "Danger" && riskLevel === "Extreme Danger") {
    lastAlertState[deviceId] = { riskLevel, timestamp: now };
    return true;
  }

  // Cooldown passed
  if (now - last.timestamp > ALERT_COOLDOWN_MS) {
    lastAlertState[deviceId] = { riskLevel, timestamp: now };
    return true;
  }

  return false;
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

    // Send SMS alert if danger or extreme danger
    if (shouldSendAlert(device_id, riskLevel)) {
      sendLiveSensorAlert(temperature, heatIndex, riskLevel);
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