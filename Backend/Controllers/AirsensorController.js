const GasReading = require("../Models/GasReading");
const DustReading = require("../Models/Dustreading");
const TemSensor = require("../Models/TemSensor");

exports.addDust = async (req, res) => {
  try {
    const data = await DustReading.create(req.body);

    const wss = req.app.get("wss");
    if (wss) {
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            type: "DUST_UPDATE",
            data: data.toJSON(),
          }));
        }
      });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error("Dust error:", err.message);
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
          client.send(JSON.stringify({
            type: "GAS_UPDATE",
            data: data.toJSON(),
          }));
        }
      });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error("Gas error:", err.message);
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
          client.send(JSON.stringify({
            type: "TEMP_UPDATE",
            data: data.toJSON(),
          }));
        }
      });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error("TempHum error:", err.message);
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

exports.getDust = async (req, res) => {
  try {
    const data = await DustReading.findAll({ order: [["createdAt", "DESC"]] });
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
