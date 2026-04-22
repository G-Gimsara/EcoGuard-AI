const axios = require("axios");

const TEXTLK_API_URL = process.env.TEXTLK_API_URL || "https://app.text.lk/api/v3/sms/send";
const TEXTLK_API_KEY = process.env.TEXTLK_API_KEY || "";
const TEXTLK_SENDER_ID = process.env.TEXTLK_SENDER_ID || "TextLKDemo";

function normalizePhone(value = "") {
  const digits = String(value).replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("94")) return digits;
  if (digits.startsWith("0")) return `94${digits.slice(1)}`;
  return digits;
}

async function sendSMS(phone, message) {
  if (!TEXTLK_API_KEY) {
    throw new Error("TEXTLK_API_KEY is not configured");
  }

  const phones = Array.isArray(phone) ? phone : [phone];
  const recipients = Array.from(
    new Set(
      phones
        .map(normalizePhone)
        .filter((item) => /^94\d{9}$/.test(item))
    )
  );

  if (!recipients.length) {
    throw new Error("No valid recipients");
  }

  await axios.post(
    TEXTLK_API_URL,
    {
      recipient: recipients.join(","),
      sender_id: TEXTLK_SENDER_ID,
      type: "plain",
      message,
    },
    {
      headers: {
        Authorization: `Bearer ${TEXTLK_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );
}

module.exports = {
  sendSMS,
  normalizePhone,
};
