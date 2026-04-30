const express = require("express");
const {
  registerAlertUser,
  getAlertUsers,
  updateAlertUserSubscription,
  deleteAlertUser,
  requestUnsubscribeOtp,
  verifyUnsubscribeOtp,
} = require("../Controllers/FloodAlertUserController");

const router = express.Router();

// Subscribe endpoint:
router.post("/register", registerAlertUser);

// Unsubscribe OTP flow.
router.post("/unsubscribe/request-otp", requestUnsubscribeOtp);
router.post("/unsubscribe/verify-otp", verifyUnsubscribeOtp);

// Admin/manage routes for subscriber list.
router.get("/", getAlertUsers);
router.patch("/:id/subscription", updateAlertUserSubscription);
router.delete("/:id", deleteAlertUser);

module.exports = router;
