const FloodAlertUser = require("../Models/FloodAlertUser");
const { sendSms } = require("../Services/textlkFloodSms");
const { randomInt } = require("crypto");

const SL_PHONE_REGEX = /^947\d{8}$/;
const OTP_TTL_MS = 5 * 60 * 1000;

function generateOtp() {
  return String(randomInt(100000, 1000000));
}

exports.registerAlertUser = async (req, res) => {
  try {
    const name = (req.body?.name || "").trim();
    const phoneNumber = (req.body?.phoneNumber || "").trim();
    const otp = String(req.body?.otp || "").trim();

    if (!name) {
      return res.status(400).json({ message: "Name is required." });
    }

    if (!SL_PHONE_REGEX.test(phoneNumber)) {
      return res.status(400).json({
        message: "Phone number must be in format 947XXXXXXXX.",
      });
    }

    let user = await FloodAlertUser.findOne({ where: { phoneNumber } });

    if (!otp) {
      if (user && user.isSubscribed) {
        return res.status(409).json({ message: "Phone number is already subscribed." });
      }

      const generatedOtp = generateOtp();

      if (!user) {
        user = await FloodAlertUser.create({
          name,
          phoneNumber,
          isSubscribed: false,
          unsubscribeOtp: generatedOtp,
          unsubscribeOtpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
        });
      } else {
        user.name = name;
        user.unsubscribeOtp = generatedOtp;
        user.unsubscribeOtpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
        await user.save();
      }

      
      await sendSms(
        phoneNumber,
        `Your EcoGuard AI Flood Alerts subscribe OTP is ${generatedOtp}. Do not share this code.`
      );

      return res.json({ message: "OTP sent successfully." });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: "OTP must be a 6-digit number." });
    }

    if (!user) {
      return res.status(400).json({ message: "OTP not requested. Please request a new OTP." });
    }

    if (user.isSubscribed) {
      return res.status(409).json({ message: "Phone number is already subscribed." });
    }

    if (!user.unsubscribeOtp || !user.unsubscribeOtpExpiresAt) {
      return res.status(400).json({ message: "OTP not requested. Please request a new OTP." });
    }

    if (Date.now() > new Date(user.unsubscribeOtpExpiresAt).getTime()) {
      user.unsubscribeOtp = null;
      user.unsubscribeOtpExpiresAt = null;
      await user.save();
      return res.status(400).json({ message: "OTP expired. Please request a new OTP." });
    }

    if (user.unsubscribeOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    user.name = name;
    user.isSubscribed = true;
    user.unsubscribeOtp = null;
    user.unsubscribeOtpExpiresAt = null;
    await user.save();

    try {
      await sendSms(
        phoneNumber,
        "You have successfully subscribed to EcoGuard AI Flood Alert Service. You will now receive flood alerts. To unsubscribe, visit your dashboard."
      );
    } catch (smsError) {
      console.error("Subscription SMS send error:", smsError.message || smsError);
    }

    return res.status(201).json({
      message: "Successfully subscribed to Flood Alert Service.",
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

exports.deleteAlertUser = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid user id." });
    }

    const user = await FloodAlertUser.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    await user.destroy();
    return res.json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("deleteAlertUser error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.requestUnsubscribeOtp = async (req, res) => {
  try {
    const phoneNumber = (req.body?.phoneNumber || "").trim();

    if (!SL_PHONE_REGEX.test(phoneNumber)) {
      return res.status(400).json({
        message: "Phone number must be in format 947XXXXXXXX.",
      });
    }

    const user = await FloodAlertUser.findOne({ where: { phoneNumber } });
    if (!user || !user.isSubscribed) {
      return res.status(404).json({ message: "No active subscription found for this phone number." });
    }

    const otp = generateOtp();
    user.unsubscribeOtp = otp;
    user.unsubscribeOtpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
    await user.save();

    await sendSms(
      phoneNumber,
      `Your EcoGuard AI unsubscribe OTP is ${otp}. Do not share this code.`
    );

    return res.json({ message: "OTP sent successfully." });
  } catch (error) {
    console.error("requestUnsubscribeOtp error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.verifyUnsubscribeOtp = async (req, res) => {
  try {
    const phoneNumber = (req.body?.phoneNumber || "").trim();
    const otp = String(req.body?.otp || "").trim();

    if (!SL_PHONE_REGEX.test(phoneNumber)) {
      return res.status(400).json({
        message: "Phone number must be in format 947XXXXXXXX.",
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: "OTP must be a 6-digit number." });
    }

    const user = await FloodAlertUser.findOne({ where: { phoneNumber } });
    if (!user || !user.isSubscribed) {
      return res.status(404).json({ message: "No active subscription found for this phone number." });
    }

    if (!user.unsubscribeOtp || !user.unsubscribeOtpExpiresAt) {
      return res.status(400).json({ message: "OTP not requested. Please request a new OTP." });
    }

    if (Date.now() > new Date(user.unsubscribeOtpExpiresAt).getTime()) {
      user.unsubscribeOtp = null;
      user.unsubscribeOtpExpiresAt = null;
      await user.save();
      return res.status(400).json({ message: "OTP expired. Please request a new OTP." });
    }

    if (user.unsubscribeOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    user.isSubscribed = false;
    user.unsubscribeOtp = null;
    user.unsubscribeOtpExpiresAt = null;
    await user.save();

    try {
      await sendSms(
        phoneNumber,
        "You have successfully unsubscribed from EcoGuard AI Flood Alert Service. You will no longer receive alerts."
      );
    } catch (smsError) {
      console.error("Unsubscribe success SMS send error:", smsError.message || smsError);
    }

    return res.json({ message: "Successfully unsubscribed from Flood Alert Service." });
  } catch (error) {
    console.error("verifyUnsubscribeOtp error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
