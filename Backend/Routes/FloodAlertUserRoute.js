const express = require("express");
const {
  registerAlertUser,
  getAlertUsers,
  updateAlertUserSubscription,
  deleteAlertUser,
} = require("../Controllers/FloodAlertUserController");

const router = express.Router();

router.post("/register", registerAlertUser);
router.get("/", getAlertUsers);
router.patch("/:id/subscription", updateAlertUserSubscription);
router.delete("/:id", deleteAlertUser);

module.exports = router;
