// controllers/pollutionController.js
const PollutionData = require("../Models/Pollution"); // note correct model

// Add new pollution data
exports.addPollutionData = async (req, res) => {
  try {
    const data = await PollutionData.create(req.body); // use create() directly
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get latest pollution by area
exports.getAreaPollution = async (req, res) => {
  try {
    const { area } = req.params;
    const data = await PollutionData.findOne({
      where: { area_name: area },
      order: [["created_at", "DESC"]],
    });

    if (!data) {
      return res.json({ message: "No data found" });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all pollution data
exports.getAllPollutionData = async (req, res) => {
  try {
    const data = await PollutionData.findAll({
      order: [["created_at", "DESC"]],
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Chat-like response
exports.chat = async (req, res) => {
  const { message, area } = req.body;

  const pollution = await PollutionData.findOne({
    where: { area_name: area },
    order: [["created_at", "DESC"]],
  });

  if (!pollution) {
    return res.json({ reply: "No pollution data available." });
  }

  if (message.includes("pollution")) {
    return res.json({
      reply: `Current pollution in ${area} is ${pollution.status}. PM2.5 level is ${pollution.pm25}`,
    });
  }

  if (message.includes("tomorrow")) {
    return res.json({
      reply: "Prediction: Pollution may increase during morning traffic.",
    });
  }

  return res.json({
    reply: "Ask about pollution level or prediction.",
  });
};