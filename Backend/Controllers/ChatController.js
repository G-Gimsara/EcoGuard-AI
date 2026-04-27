const axios = require("axios");

const AmoniaReading = require("../Models/AmoniaReading");
const AirQuality = require("../Models/Airquality");
const DustReading = require("../Models/Dustreading");
const COReading = require("../Models/COReading");
const Co2Reading = require("../Models/Co2Reading");
const Airuser       = require('../Models/Airuser');

const AIROPENAI_API_KEY = process.env.AIROPENAI_API_KEY;

// ─────────────────────────────
// 📊 GET LATEST DATA
// ─────────────────────────────
const getLatestRecord = async (type) => {
  switch (type) {
    case "gas":
      return await AmoniaReading.findOne({ order: [["createdAt", "DESC"]] });

    case "temp":
      return await AirQuality.findOne({ order: [["recorded_at", "DESC"]] });

    case "dust":
      return await DustReading.findOne({ order: [["recorded_at", "DESC"]] });

    case "co":
      return await COReading.findOne({ order: [["recorded_at", "DESC"]] });

    case "co2":
      return await Co2Reading.findOne({ order: [["recorded_at", "DESC"]] });

    default:
      return null;
  }
};

// ─────────────────────────────
// 🧠 SENSOR FORMATTER (NO AI CHAOS)
// ─────────────────────────────
const buildSensorMessage = (type, data) => {
  switch (type) {

    case "co":
      return {
        message: `CO level is ${data.co_value} mg/m³ and status is ${data.status}`,
      };

    case "co2":
      return {
        message: `CO2 level is ${data.eco2} ppm and air quality is ${data.status}`,
      };

    case "dust":
      return {
        message: `Dust level is ${data.dust_density} µg/m³ and air quality is ${data.air_status}`,
      };

    case "gas":
      return {
        message: `Ammonia level is ${data.gas_ppm} ppm and status is ${data.air_status}`,
      };

    case "temp":
      return {
        message: `Temperature is ${data.temperature}°C`,
      };

    default:
      return {
        message: "No sensor data available",
      };
  }
};

// ─────────────────────────────
// 🤖 CHAT SENSOR API
// ─────────────────────────────
const chatSensor = async (req, res) => {
  try {
    const { sensorType, question } = req.body;

    const latestData = await getLatestRecord(sensorType);

    if (!latestData) {
      return res.status(404).json({ message: "No data found" });
    }

    // ─────────────────────────────
    // ⚡ SIMPLE RULE ENGINE (NO AI FOR BASIC DATA)
    // ─────────────────────────────

    const isSimpleQuery =
      question.toLowerCase().includes("latest") ||
      question.toLowerCase().includes("status") ||
      question.toLowerCase().includes("current");

    // ✔ If simple request → NO AI, just clean output
    if (isSimpleQuery) {
      return res.json({
        reply: buildSensorMessage(sensorType, latestData),
      });
    }

    // ─────────────────────────────
    // 🧠 AI ONLY FOR COMPLEX QUESTIONS
    // ─────────────────────────────

    const prompt = `
You are an air quality assistant.

RULES:
- Be short and conversational
- Do NOT repeat sensor values if already shown
- Avoid long explanations
- If user asks "more", continue naturally

Sensor Type: ${sensorType}
Data: ${JSON.stringify(latestData)}
User Question: ${question}

Return ONLY JSON:
{
  "message": "short helpful response"
}
`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful air quality assistant. Always return ONLY JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${AIROPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const raw = response.data.choices[0].message.content;

    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      parsed = {
        message: raw,
      };
    }

    return res.json({
      reply: parsed,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: err.message,
    });
  }
};


// GET USER PLAN
const getUserByPhone = async (req, res) => {
  try {
    const { phone } = req.body;

    const user = await Airuser.findOne({ where: { phone } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      name: user.name,
      phone: user.phone,
      alert_frequency: user.alert_frequency,
      next_alert_at: user.next_alert_at,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE PLAN
const updateSubscription = async (req, res) => {
  try {
    const { phone, alert_frequency } = req.body;

    const user = await Airuser.findOne({ where: { phone } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // calculate next alert
    const now = new Date();
    let next = null;

    if (alert_frequency === "daily") {
      next = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    if (alert_frequency === "weekly") {
      next = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    await user.update({
      alert_frequency,
      next_alert_at: next,
    });

    return res.json({
      message: "Subscription updated",
      alert_frequency,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  chatSensor,
  getUserByPhone,
  updateSubscription
};