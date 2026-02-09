const FloodSubscriber = require("../models/Fubscriber");

// USER registers for alerts
exports.registerSubscriber = async (req, res) => {
  try {
    const {
      fullName,
      phoneNumber,
      email,
      address,
      alertMethods,
      riskLevels,
      language,
    } = req.body;

    if (!phoneNumber || !address) {
      return res.status(400).json({
        success: false,
        message: "Phone number and station required",
      });
    }

    const subscriber = await FloodSubscriber.create({
      fullName,
      phoneNumber,
      email,
      station: address,
      alertMethods,
      riskLevels,
      language,
      userId: req.user?.id || null,
    });

    res.status(201).json({
      success: true,
      data: subscriber,
    });
  } catch (err) {
    console.error("Register subscriber error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.getAllSubscribers = async (req, res) => {
  try {
    const { station } = req.query;

    const where = {};
    if (station) where.station = station;

    const list = await FloodSubscriber.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    res.json(list);
  } catch (err) {
    console.error("Authority list error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
