const HeatAlertSubscriber = require("../Models/HeatAlertSubscriber");

function normalizeLocation(value = "") {
  return value.trim().toLowerCase();
}

function normalizePhone(value = "") {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return "";

  if (digits.startsWith("94")) return digits;
  if (digits.startsWith("0")) return `94${digits.slice(1)}`;
  return digits;
}

async function registerSubscriber(req, res) {
  try {
    const { name, mobile, location } = req.body;

    if (!name || !mobile || !location) {
      return res.status(400).json({
        error: "name, mobile and location are required",
      });
    }

    const normalizedMobile = normalizePhone(mobile);
    if (!/^94\d{9}$/.test(normalizedMobile)) {
      return res.status(400).json({
        error: "Mobile number must be a valid Sri Lankan number (e.g. 94710000000)",
      });
    }

    const existingByMobile = await HeatAlertSubscriber.findOne({
      where: { mobile: normalizedMobile },
    });

    if (existingByMobile) {
      await existingByMobile.update({
        name: String(name).trim(),
        location: String(location).trim(),
        isActive: true,
      });

      return res.status(200).json({
        message: "Registration updated successfully",
        subscriber: existingByMobile,
      });
    }

    const subscriber = await HeatAlertSubscriber.create({
      name: String(name).trim(),
      mobile: normalizedMobile,
      location: String(location).trim(),
    });

    return res.status(201).json({
      message: "Registered for heat alert SMS successfully",
      subscriber,
    });
  } catch (error) {
    console.error("[HeatAlertSubscriber] register failed:", error.message);
    return res.status(500).json({
      error: "Failed to register subscriber",
    });
  }
}

module.exports = {
  registerSubscriber,
  normalizeLocation,
  normalizePhone,
};
