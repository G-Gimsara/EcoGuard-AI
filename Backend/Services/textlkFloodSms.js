const axios = require("axios");
const FloodAlertUser = require("../Models/FloodAlertUser");

const TEXTLK_URL = "https://app.text.lk/api/v3/sms/send";
const HIGH_LEVELS = new Set(["Major", "Critical"]);

// Remove filler words so SMS keeps only area + depth essentials.
const SOFT_NOISE = /\b(severe|evacuation|households|ankle-deep|pooling|roads|major homes|yards|home entry)\b/gi;

function shouldSendFloodSms(previousSeverity, currentSeverity) {
  if (!HIGH_LEVELS.has(currentSeverity)) return false;
  if (previousSeverity === currentSeverity) return false;
  return true;
}

function normalizeDepth(text) {
  const m = String(text).match(/(\d+(?:-\d+)?)\s*ft/i);
  return m ? `${m[1]} ft` : "";
}

// Parse one config line (e.g. "A/B — 3-5 ft") into {name, depth} pairs.
function parseConfigLine(line) {
  const cleaned = String(line).replace(SOFT_NOISE, "").replace(/\s+/g, " ").trim();
  const m = cleaned.match(/^(.+?)\s*[—\-]\s*(.+)$/);
  if (!m) return [];

  const left = m[1].trim();
  const right = m[2].trim();
  const depth = normalizeDepth(right);
  if (!depth) return [];

  const names = left
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);

  return names.map((name) => ({ name, depth }));
}

// Convert multiline affected-area text into one compact SMS line.
function formatAffectedLine(label, raw) {
  if (!raw || !String(raw).trim() || /^no areas affected$/i.test(String(raw).trim())) {
    return `${label}: —.`;
  }

  const pairs = [];
  for (const line of String(raw).split("\n")) {
    const t = line.trim();
    if (t) pairs.push(...parseConfigLine(t));
  }

  if (!pairs.length) {
    return `${label}: —.`;
  }

  const segments = pairs.map(({ name, depth }) => `${name} (${depth})`);
  return `${label}: ${segments.join(", ")}.`;
}

// Build final SMS body per severity using cleaned area/depth lines.
function buildFloodMessage({ currentSeverity, firstAffected, nextAffected }) {
  const firstLine = formatAffectedLine("First Affected", firstAffected);
  const nextLine = formatAffectedLine("Next Affected", nextAffected);

  if (currentSeverity === "Major") {
    return `EcoGuard Flood MAJOR alert.\n${firstLine}\n${nextLine}\nBe prepared to evacuate and stay alert.`;
  }

  if (currentSeverity === "Critical") {
    return `EcoGuard Flood CRITICAL alert.\n${firstLine}\n${nextLine}\nEvacuate immediately and follow local authority guidance.`;
  }

  return "";
}

async function sendSms(phoneNumber, message) {
  const token = process.env.TEXTLK_API_TOKEN;
  const senderId = process.env.TEXTLK_SENDER_ID;

  if (!token || !senderId) {
    throw new Error("TEXTLK_API_TOKEN or TEXTLK_SENDER_ID is missing.");
  }

  // Text.lk v3 send endpoint.
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

async function sendMajorCriticalFloodSms({ previousSeverity, currentSeverity, firstAffected, nextAffected }) {
  // Send only when crossing into Major/Critical.
  if (!shouldSendFloodSms(previousSeverity, currentSeverity)) {
    return { skipped: true, reason: "No eligible severity transition", sent: 0, failed: 0 };
  }

  // Broadcast to all currently subscribed recipients.
  const subscribedUsers = await FloodAlertUser.findAll({
    where: { isSubscribed: true },
    attributes: ["phoneNumber"],
  });

  if (subscribedUsers.length === 0) {
    return { skipped: true, reason: "No subscribed users", sent: 0, failed: 0 };
  }

  const message = buildFloodMessage({ currentSeverity, firstAffected, nextAffected });
  if (!message) {
    return { skipped: true, reason: "No SMS body for severity", sent: 0, failed: 0 };
  }
  let sent = 0;
  let failed = 0;

  // Send sequentially to keep provider calls predictable and logs readable.
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
  buildFloodMessage,
  sendSms,
};
