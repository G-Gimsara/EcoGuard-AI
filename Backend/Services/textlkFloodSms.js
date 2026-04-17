const axios = require("axios");
const FloodAlertUser = require("../Models/FloodAlertUser");

const TEXTLK_URL = "https://app.text.lk/api/v3/sms/send";
const HIGH_LEVELS = new Set(["Major", "Critical"]);

function shouldSendFloodSms(previousSeverity, currentSeverity) {
  if (!HIGH_LEVELS.has(currentSeverity)) return false;
  if (previousSeverity === currentSeverity) return false;
  return true;
}

function buildFloodMessage({ currentSeverity, riseLevel }) {
  return `EcoGuard Flood ${currentSeverity} alert. Water rise ${riseLevel} mm. Move to safe area and follow local authority guidance.`;
}

async function sendSms(phoneNumber, message) {
  const token = process.env.TEXTLK_API_TOKEN;
  const senderId = process.env.TEXTLK_SENDER_ID;

  if (!token || !senderId) {
    throw new Error("TEXTLK_API_TOKEN or TEXTLK_SENDER_ID is missing.");
  }

  await axios.post(
    TEXTLK_URL,
    {
      recipient: phoneNumber,
      sender_id: senderId,
      message,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    }
  );
}

async function sendMajorCriticalFloodSms({ previousSeverity, currentSeverity, riseLevel }) {
  if (!shouldSendFloodSms(previousSeverity, currentSeverity)) {
    return { skipped: true, reason: "No eligible severity transition", sent: 0, failed: 0 };
  }

  const subscribedUsers = await FloodAlertUser.findAll({
    where: { isSubscribed: true },
    attributes: ["phoneNumber"],
  });

  if (subscribedUsers.length === 0) {
    return { skipped: true, reason: "No subscribed users", sent: 0, failed: 0 };
  }

  const message = buildFloodMessage({ currentSeverity, riseLevel });
  let sent = 0;
  let failed = 0;

  for (const user of subscribedUsers) {
    try {
      await sendSms(user.phoneNumber, message);
      sent += 1;
    } catch (error) {
      failed += 1;
      console.error(`[flood-sms] Failed for ${user.phoneNumber}:`, error.message);
    }
  }

  return {
    skipped: false,
    reason: null,
    sent,
    failed,
  };
}

module.exports = {
  sendMajorCriticalFloodSms,
  shouldSendFloodSms,
};
