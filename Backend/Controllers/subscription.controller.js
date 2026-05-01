const Subscriber = require("../Models/subscriber.model");
const { sendSMS, normalizePhone } = require("../Services/sms.service");
const { generateOTP, getOtpExpiry } = require("../Services/otp.service");

const SUBSCRIBE_OTP_SMS = (otp) => `Your EcoGuard subscription OTP is: ${otp}.Do not share`;
const SUBSCRIBE_SUCCESS_SMS =
  "You have successfully subscribed to EcoGuard AI Heat Alert Service. You will now receive Heat riskalerts. To unsubscribe, visit our Urban Heat Risk Monitoring dashboard";
const UNSUBSCRIBE_OTP_SMS = (otp) => `Your EcoGuard unsubscribe OTP is: ${otp}. Do not share.`;
const UNSUBSCRIBE_SUCCESS_SMS =
  "You have successfully unsubscribed from EcoGuard AI Heat Alert Service. You will no longer receive alerts.";

function isValidSriLankanPhone(phone) {
  return /^94\d{9}$/.test(phone);
}

async function sendSubscribeOTP(req, res) {
  try {
    const { full_name, phone_number } = req.body;

    if (!full_name || !phone_number) {
      return res.status(400).json({ error: "full_name and phone_number are required" });
    }

    const trimmedName = String(full_name).trim();
    const normalizedPhone = normalizePhone(phone_number);

    if (!trimmedName) {
      return res.status(400).json({ error: "full_name cannot be empty" });
    }

    if (!isValidSriLankanPhone(normalizedPhone)) {
      return res.status(400).json({ error: "Invalid Sri Lankan phone number" });
    }

    const otpCode = generateOTP();
    const otpExpiresAt = getOtpExpiry(5);

    const existing = await Subscriber.findOne({ where: { phoneNumber: normalizedPhone } });
    if (existing) {
      await existing.update({
        fullName: trimmedName,
        otpCode,
        otpExpiresAt,
      });
    } else {
      await Subscriber.create({
        fullName: trimmedName,
        phoneNumber: normalizedPhone,
        isSubscribed: false,
        otpCode,
        otpExpiresAt,
      });
    }

    await sendSMS(normalizedPhone, SUBSCRIBE_OTP_SMS(otpCode));

    return res.status(200).json({ message: "Subscription OTP sent successfully" });
  } catch (error) {
    console.error("[Subscription] sendSubscribeOTP failed:", error.message);
    return res.status(500).json({ error: "Failed to send subscription OTP" });
  }
}

async function confirmSubscribe(req, res) {
  try {
    const { full_name, phone_number, otp_code } = req.body;

    if (!full_name || !phone_number || !otp_code) {
      return res.status(400).json({ error: "full_name, phone_number and otp_code are required" });
    }

    const trimmedName = String(full_name).trim();
    const normalizedPhone = normalizePhone(phone_number);

    if (!trimmedName) {
      return res.status(400).json({ error: "full_name cannot be empty" });
    }

    if (!isValidSriLankanPhone(normalizedPhone)) {
      return res.status(400).json({ error: "Invalid Sri Lankan phone number" });
    }

    const subscriber = await Subscriber.findOne({ where: { phoneNumber: normalizedPhone } });

    if (!subscriber) {
      return res.status(404).json({ error: "Subscriber not found. Please request a new OTP" });
    }

    const now = new Date();
    if (!subscriber.otpCode || subscriber.otpCode !== String(otp_code).trim()) {
      return res.status(400).json({ error: "Invalid OTP code" });
    }

    if (!subscriber.otpExpiresAt || now > new Date(subscriber.otpExpiresAt)) {
      return res.status(400).json({ error: "OTP expired. Please request a new OTP" });
    }

    await subscriber.update({
      fullName: trimmedName,
      isSubscribed: true,
      otpCode: null,
      otpExpiresAt: null,
    });

    await sendSMS(normalizedPhone, SUBSCRIBE_SUCCESS_SMS);

    return res.status(200).json({ message: "Subscribed successfully" });
  } catch (error) {
    console.error("[Subscription] confirmSubscribe failed:", error.message);
    return res.status(500).json({ error: "Failed to confirm subscription" });
  }
}

async function sendUnsubscribeOTP(req, res) {
  try {
    const { phone_number } = req.body;

    if (!phone_number) {
      return res.status(400).json({ error: "phone_number is required" });
    }

    const normalizedPhone = normalizePhone(phone_number);

    if (!isValidSriLankanPhone(normalizedPhone)) {
      return res.status(400).json({ error: "Invalid Sri Lankan phone number" });
    }

    const subscriber = await Subscriber.findOne({
      where: { phoneNumber: normalizedPhone, isSubscribed: true },
    });

    if (!subscriber) {
      return res.status(404).json({ error: "Active subscriber not found for this number" });
    }

    const otpCode = generateOTP();
    const otpExpiresAt = getOtpExpiry(5);

    await subscriber.update({ otpCode, otpExpiresAt });

    await sendSMS(normalizedPhone, UNSUBSCRIBE_OTP_SMS(otpCode));

    return res.status(200).json({ message: "Unsubscribe OTP sent successfully" });
  } catch (error) {
    console.error("[Subscription] sendUnsubscribeOTP failed:", error.message);
    return res.status(500).json({ error: "Failed to send unsubscribe OTP" });
  }
}

async function confirmUnsubscribe(req, res) {
  try {
    const { phone_number, otp_code } = req.body;

    if (!phone_number || !otp_code) {
      return res.status(400).json({ error: "phone_number and otp_code are required" });
    }

    const normalizedPhone = normalizePhone(phone_number);

    if (!isValidSriLankanPhone(normalizedPhone)) {
      return res.status(400).json({ error: "Invalid Sri Lankan phone number" });
    }

    const subscriber = await Subscriber.findOne({
      where: { phoneNumber: normalizedPhone, isSubscribed: true },
    });

    if (!subscriber) {
      return res.status(404).json({ error: "Active subscriber not found for this number" });
    }

    const now = new Date();
    if (!subscriber.otpCode || subscriber.otpCode !== String(otp_code).trim()) {
      return res.status(400).json({ error: "Invalid OTP code" });
    }

    if (!subscriber.otpExpiresAt || now > new Date(subscriber.otpExpiresAt)) {
      return res.status(400).json({ error: "OTP expired. Please request a new OTP" });
    }

    await subscriber.update({
      isSubscribed: false,
      otpCode: null,
      otpExpiresAt: null,
    });

    await sendSMS(normalizedPhone, UNSUBSCRIBE_SUCCESS_SMS);

    return res.status(200).json({ message: "Unsubscribed successfully" });
  } catch (error) {
    console.error("[Subscription] confirmUnsubscribe failed:", error.message);
    return res.status(500).json({ error: "Failed to confirm unsubscription" });
  }
}

module.exports = {
  sendSubscribeOTP,
  confirmSubscribe,
  sendUnsubscribeOTP,
  confirmUnsubscribe,
};
