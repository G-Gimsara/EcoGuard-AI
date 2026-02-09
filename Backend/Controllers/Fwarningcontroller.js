const StationReading = require("../Models/Fwarning");

// ---------------- CREATE READING ----------------
exports.createReading = async (req, res) => {
  try {
    const {
      station_id,
      timestamp,
      water_level_cm,
      rainfall_mm,
      battery,
      lat,
      lon,
    } = req.body;

    // Basic validation
    if (
      !station_id ||
      !timestamp ||
      water_level_cm == null ||
      rainfall_mm == null ||
      lat == null ||
      lon == null
    ) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const reading = await StationReading.create({
      station_id,
      timestamp,
      water_level_cm,
      rainfall_mm,
      battery,
      lat,
      lon,
    });

    res.status(201).json({
      message: "Reading saved successfully",
      data: reading,
    });
  } catch (error) {
    console.error("Create reading error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// ---------------- GET LATEST BY STATION ----------------
exports.getLatestByStation = async (req, res) => {
  try {
    const { station_id } = req.params;

    const latest = await StationReading.findOne({
      where: { station_id },
      order: [["timestamp", "DESC"]],
    });

    if (!latest) {
      return res.status(404).json({
        message: "No data found for this station",
      });
    }

    res.json(latest);
  } catch (error) {
    console.error("Get latest error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- GET HISTORY ----------------
exports.getHistory = async (req, res) => {
  try {
    const { station_id } = req.params;
    const { from, to } = req.query;

    const where = { station_id };

    if (from && to) {
      where.timestamp = {
        [require("sequelize").Op.between]: [new Date(from), new Date(to)],
      };
    }

    const data = await StationReading.findAll({
      where,
      order: [["timestamp", "ASC"]],
    });

    res.json(data);
  } catch (error) {
    console.error("Get history error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
