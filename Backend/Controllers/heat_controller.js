

const axios = require("axios");
const Prediction = require("../Models/heat_prediction.js");
const { Op, fn, col } = require("sequelize");


const syncPredictions = async (req, res) => {
  try {
    const response = await axios.get(`${process.env.FASTAPI_URL}/predict`);
    const predictions = response.data;

    if (!Array.isArray(predictions)) throw new Error("Invalid data format");

    for (const row of predictions) {
      await Prediction.upsert({
        location: row.location,
        date: row.datetime,
        tempmax: row.tempmax,
        humidity: row.humidity,
        dew: row.dew,
        solarradiation: row.solarradiation,
        heat_index: row.heat_index_C,
        risk_level: row.risk_level,
      });
    }

    if (res) return res.json({ message: "✅ Predictions synced", rows: predictions.length });
    return predictions.length;
  } catch (err) {
    if (res) return res.status(500).json({ error: "Sync failed" });
    throw err;
  }
};


const getAllPredictions = async (req, res) => {
  try {
    const data = await Prediction.findAll({
      order: [['date', 'ASC'], ['location', 'ASC']]
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch predictions" });
  }
};


const getTodayMap = async (req, res) => {
  try {
    const results = await Prediction.findAll({
      where: {
        date: fn('CURRENT_DATE') 
      },
      attributes: ['location', 'tempmax', 'heat_index']
    });

    const mapData = {};
    results.forEach(r => {
      mapData[r.location] = {
        tempmax: Number(r.tempmax),
        heat_index: Number(r.heat_index)
      };
    });

    res.json(mapData);
  } catch (err) {
    res.status(500).json({ error: "Map data fetch failed" });
  }
};


module.exports = {
  syncPredictions,
  getAllPredictions,
  getTodayMap
};