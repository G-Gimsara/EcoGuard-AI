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

router.post("/register", registerAlertUser);
router.post("/unsubscribe/request-otp", requestUnsubscribeOtp);
router.post("/unsubscribe/verify-otp", verifyUnsubscribeOtp);
router.get("/", getAlertUsers);
router.patch("/:id/subscription", updateAlertUserSubscription);
router.delete("/:id", deleteAlertUser);

module.exports = router;
