const express = require("express");
const {
  registerAlertUser,
  getAlertUsers,
  updateAlertUserSubscription,
} = require("../Controllers/FloodAlertUserController");

const router = express.Router();

router.post("/register", registerAlertUser);
router.get("/", getAlertUsers);
router.patch("/:id/subscription", updateAlertUserSubscription);

module.exports = router;
