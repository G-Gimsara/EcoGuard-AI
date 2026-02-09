/* import axios from "axios";
import Prediction from "../Models/heat_prediction.js";
import { Op, fn, col } from "sequelize";

export const syncPredictions = async (req, res) => {
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

export const getAllPredictions = async (req, res) => {
  try {
    const data = await Prediction.findAll({
      order: [['date', 'ASC'], ['location', 'ASC']]
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch predictions" });
  }
};

export const getTodayMap = async (req, res) => {
  try {
    const results = await Prediction.findAll({
      where: {
        date: fn('CURRENT_DATE') // Sequelize way of writing CURRENT_DATE
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
}; */

const axios = require("axios");
const Prediction = require("../Models/heat_prediction.js");
const { Op, fn, col } = require("sequelize");

// 1. syncPredictions function එක define කරන්න
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

// 2. getAllPredictions function එක define කරන්න
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

// 3. getTodayMap function එක define කරන්න
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

// 4. සියලුම functions එකවර export කරන්න
module.exports = {
  syncPredictions,
  getAllPredictions,
  getTodayMap
};