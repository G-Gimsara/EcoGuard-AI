const axios = require("axios");

const sendSMS = async (phone, message) => {
  try {
    const response = await axios.post(
      "https://app.text.lk/api/v3/sms/send",
      {
        recipient: phone,
        sender_id: process.env.AIRTEXTLK_SENDER_ID,
        message: message,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTEXTLK_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (err) {
    console.error("SMS ERROR:", err.response?.data || err.message);
    throw err;
  }
};

module.exports = { sendSMS };