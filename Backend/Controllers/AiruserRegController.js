
const Airuser     = require('../Models/Airuser');

const cron = require("node-cron");
const { sendSMS } = require("./smsService");


const DustReading = require("../Models/Dustreading");
const AmoniaReading = require("../Models/AmoniaReading");
const COReading = require("../Models/COReading");
const Co2Reading = require("../Models/Co2Reading");
const AirQuality = require("../Models/Airquality");

const generateOTP = require("../utils/airotp");

// ─────────────────────────────────────────────
// 📩 FORMAT MESSAGE
// ─────────────────────────────────────────────

const sendOTP = async (req, res) => {
  try {
    let { name, phone, alert_frequency } = req.body;

    phone = normalizePhone(phone);

    const otp = generateOTP();
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    const user = await Airuser.findOne({ where: { phone } });

    // ─────────────────────────────
    // ❌ CASE 1: ALREADY VERIFIED
    // ─────────────────────────────
    if (user && user.otp_verified) {
      return res.status(400).json({
        message: "⚠ This number is already registered"
      });
    }

    // ─────────────────────────────
    // 🟡 CASE 2: USER EXISTS (NOT VERIFIED) → RESEND OTP
    // ─────────────────────────────
    if (user && !user.otp_verified) {
      await user.update({
        otp_code: otp,
        otp_expires_at: expires,
        alert_frequency
      });

      await sendSMS(phone, `Your EcoGuard OTP is: ${otp}`);

      return res.json({
        message: "OTP resent successfully"
      });
    }

    // ─────────────────────────────
    // 🟢 CASE 3: NEW USER
    // ─────────────────────────────
    await Airuser.create({
      name,
      phone,
      alert_frequency,
      otp_code: otp,
      otp_expires_at: expires,
      otp_verified: false
    });

    await sendSMS(phone, `Your EcoGuard OTP is: ${otp}`);

    return res.json({
      message: "OTP sent successfully"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const user = await Airuser.findOne({ where: { phone } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otp_verified) {
      return res.status(400).json({
        message: "Already verified"
      });
    }

    if (user.otp_code !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date() > user.otp_expires_at) {
      return res.status(400).json({ message: "OTP expired" });
    }

    await user.update({
      otp_verified: true,
      otp_code: null,
      otp_expires_at: null
    });

    return res.json({ message: "OTP verified successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const normalizePhone = (phone) => {
  if (!phone) return "";

  // convert to string safely
  phone = String(phone);

  // remove spaces, +, -, etc.
  phone = phone.replace(/\D/g, "");

  // Sri Lanka format fix
  if (phone.startsWith("0")) {
    phone = "94" + phone.slice(1);
  }

  // if user already typed 94XXXXXXXXX → keep it
  if (phone.startsWith("94") && phone.length === 11) {
    return phone;
  }

  return phone;
};


const calculateNextAlert = (frequency) => {
  const now = new Date();

  if (frequency === "daily") {
    return new Date(now.getTime() + 24 * 60 * 60 * 1000); // +1 day
  }

  if (frequency === "weekly") {
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days
  }

  return null;
};


const formatMessage = ({ name, dust, gas, co, co2, air, user }) => {

  const time = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const nextAlertText = user?.next_alert_at
    ? new Date(user.next_alert_at).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not set";

  return `
Hello ${name},

🌍 EcoGuard AIR QUALITY REPORT
📅 ${time}

━━━━━━━━━━━━━━
📌 Alert Type: ${user.alert_frequency.toUpperCase()}

⏰ Next Alert:
${nextAlertText}

━━━━━━━━━━━━━━
🌫 Dust
• Level: ${dust?.dust_density ?? "--"} µg/m³
• Status: ${dust?.air_status ?? "Unknown"}

━━━━━━━━━━━━━━
🧪 Ammonia (NH3)
• Level: ${gas?.gas_ppm ?? "--"} ppm
• Status: ${gas?.air_status ?? "Unknown"}

━━━━━━━━━━━━━━
🟤 CO
• Level: ${co?.co_value ?? "--"} mg/m³
• Status: ${co?.status ?? "Unknown"}

━━━━━━━━━━━━━━
🌿 CO2
• Level: ${co2?.eco2 ?? "--"} ppm
• Status: ${co2?.status ?? "Unknown"}

━━━━━━━━━━━━━━
🌡 Temperature
• Temp: ${air?.temperature ?? "--"} °C
• Status: ${air?.air_status ?? "Normal"}

━━━━━━━━━━━━━━

🤖 Smart Health Assistant:
https://fir-8506f.web.app/chat

Stay safe 🌱
`;
};

// ─────────────────────────────────────────────
// 📊 GET LATEST DATA
// ─────────────────────────────────────────────
const getLatestData = async () => {
  const dust = await DustReading.findOne({ order: [['recorded_at','DESC']] });
  const gas  = await AmoniaReading.findOne({ order: [['createdAt','DESC']] });
  const co   = await COReading.findOne({ order: [['recorded_at','DESC']] });
  const co2  = await Co2Reading.findOne({ order: [['recorded_at','DESC']] });
  const air  = await AirQuality.findOne({ order: [['recorded_at','DESC']] });

  return { dust, gas, co, co2, air };
};

// ─────────────────────────────────────────────
// 📩 SEND ALERT FUNCTION
// ─────────────────────────────────────────────
const sendAirAlert = async (user) => {
  try {

    // 🔒 BLOCK UNVERIFIED USERS (IMPORTANT FIX)
    if (!user.otp_verified) {
      console.log("⛔ Skipped (not verified):", user.phone);
      return;
    }

    const { dust, gas, co, co2, air } = await getLatestData();

    const message = formatMessage({
      name: user.name,
      dust,
      gas,
      co,
      co2,
      air,
      user
    });

    await sendSMS(user.phone, message);

    console.log("✅ SMS sent:", user.phone);

  } catch (err) {
    console.error("sendAirAlert error:", err.message);
  }
};


cron.schedule("* * * * *", async () => {
  console.log("🚀 Smart Cron Running...");

  const employees = await Airuser.findAll({
  where: {
    otp_verified: true   // 🔥 ONLY VERIFIED USERS
  }
});

  for (const user of employees) {

    if (user.alert_frequency === "off") continue;

    const now = new Date();
    const next = user.next_alert_at;

    // ❌ not time yet
    if (next && now < new Date(next)) continue;

    // ✅ send alert
    await sendAirAlert(user);

    // 🔥 update schedule
    const newNext = calculateNextAlert(user.alert_frequency);

    await user.update({
      last_alert_at: now,
      next_alert_at: newNext
    });

    console.log("📩 Alert sent & next scheduled:", user.name);
  }
});



// ─────────────────────────────────────────────
// ⏰ CRON JOB (DAILY + WEEKLY ONLY)
// ─────────────────────────────────────────────
/**cron.schedule("* * * * *", async () => {
  console.log("🚀 CRON RUNNING EVERY 1 MINUTE...");

  try {
    const employees = await Employee.findAll();

    console.log("👥 Users:", employees.length);

    for (const user of employees) {

      console.log("📤 Checking:", user.name, user.alert_frequency);

      if (!user.alert_frequency || user.alert_frequency === "off") continue;

      // DAILY TEST MODE → send every 1 min
      if (user.alert_frequency === "daily") {
        await sendAirAlert(user);
      }

      // WEEKLY TEST MODE
      if (user.alert_frequency === "weekly") {
        const isMonday = new Date().getDay() === 1;
        if (isMonday) {
          await sendAirAlert(user);
        }
      }
    }

  } catch (err) {
    console.error("❌ Cron Error:", err);
  }
}); */

// ─────────────────────────────────────────────
// 👤 CREATE EMPLOYEE (FIRST TIME SMS HERE)
// ─────────────────────────────────────────────
const createEmployee = async (req, res) => {
  try {
    const { phone } = req.body;

    const user = await Airuser.findOne({ where: { phone } });

    if (!user || !user.otp_verified) {
      return res.status(403).json({
        message: "User not verified"
      });
    }

    const nextAlert = calculateNextAlert(user.alert_frequency);

    await user.update({
      last_alert_at: new Date(),
      next_alert_at: nextAlert
    });

    // ONLY NOW start sending air alerts
    await sendAirAlert(user);

    res.json({ message: "User activated" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* ---------------- GET ALL EMPLOYEES ---------------- */
const getAllEmployees = async (req, res) => {
  try {
    const employees = await Airuser.findAll();

    return res.status(200).json({
      message: "Employees fetched successfully",
      data: employees
    });

  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
};







// ── Export Controllers ────────────────────

module.exports = {
  sendOTP,
  createEmployee,
  getAllEmployees,
  verifyOTP,

};