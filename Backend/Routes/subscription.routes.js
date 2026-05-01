const express = require("express");
const {
  sendSubscribeOTP,
  confirmSubscribe,
  sendUnsubscribeOTP,
  confirmUnsubscribe,
} = require("../Controllers/subscription.controller");

const router = express.Router();

router.post("/subscribe/send-otp", sendSubscribeOTP);
router.post("/subscribe/confirm", confirmSubscribe);
router.post("/unsubscribe/send-otp", sendUnsubscribeOTP);
router.post("/unsubscribe/confirm", confirmUnsubscribe);

module.exports = router;
