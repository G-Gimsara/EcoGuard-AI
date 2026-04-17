const FloodAlertUser = require("../Models/FloodAlertUser");

const SL_PHONE_REGEX = /^947\d{8}$/;

exports.registerAlertUser = async (req, res) => {
  try {
    const name = (req.body?.name || "").trim();
    const phoneNumber = (req.body?.phoneNumber || "").trim();

    if (!name) {
      return res.status(400).json({ message: "Name is required." });
    }

    if (!SL_PHONE_REGEX.test(phoneNumber)) {
      return res.status(400).json({
        message: "Phone number must be in format 947XXXXXXXX.",
      });
    }

    const existing = await FloodAlertUser.findOne({ where: { phoneNumber } });
    if (existing) {
      return res.status(409).json({ message: "Phone number is already registered." });
    }

    const user = await FloodAlertUser.create({
      name,
      phoneNumber,
      isSubscribed: true,
    });

    return res.status(201).json({
      message: "You will receive flood alerts.",
      user: {
        id: user.id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        isSubscribed: user.isSubscribed,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("registerAlertUser error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAlertUsers = async (_req, res) => {
  try {
    const users = await FloodAlertUser.findAll({
      order: [["createdAt", "DESC"]],
      attributes: ["id", "name", "phoneNumber", "isSubscribed", "createdAt"],
    });
    return res.json(users);
  } catch (error) {
    console.error("getAlertUsers error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateAlertUserSubscription = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { isSubscribed } = req.body || {};

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid user id." });
    }

    if (typeof isSubscribed !== "boolean") {
      return res.status(400).json({ message: "isSubscribed must be boolean." });
    }

    const user = await FloodAlertUser.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.isSubscribed = isSubscribed;
    await user.save();

    return res.json({
      message: isSubscribed ? "User subscribed for alerts." : "User unsubscribed from alerts.",
      user: {
        id: user.id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        isSubscribed: user.isSubscribed,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("updateAlertUserSubscription error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
