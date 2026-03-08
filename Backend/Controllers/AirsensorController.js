// controllers/airSensorController.js
const GasReading = require("../Models/GasReading");
const DustReading = require("../Models/DustReading");
const TemSensor = require("../Models/TemSensor");

exports.addDust = async (req, res) => {
  try {
    const data = await DustReading.create(req.body);

    const wss = req.app.get("wss");
    if (wss) {
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(
            JSON.stringify({
              type: "DUST_UPDATE",
              data: data.toJSON(), // <-- FIX: send plain JSON
            })
          );
        }
      });
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addGas = async (req, res) => {
  try {
    const data = await GasReading.create(req.body);

    const wss = req.app.get("wss");
    if (wss) {
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(
            JSON.stringify({
              type: "GAS_UPDATE",
              data: data.toJSON(), // <-- FIX
            })
          );
        }
      });
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addTempHum = async (req, res) => {
  try {
    const data = await TemSensor.create(req.body);

    const wss = req.app.get("wss");
    if (wss) {
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(
            JSON.stringify({
              type: "TEMP_UPDATE",
              data: data.toJSON(), // <-- FIX
            })
          );
        }
      });
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET endpoints (no change needed)
exports.getDust = async (req, res) => {
  try {
    const data = await DustReading.findAll({ order: [["createdAt", "DESC"]] });
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getGas = async (req, res) => {
  try {
    const data = await GasReading.findAll({ order: [["createdAt", "DESC"]] });
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTempHum = async (req, res) => {
  try {
    const data = await TemSensor.findAll({ order: [["createdAt", "DESC"]] });
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};