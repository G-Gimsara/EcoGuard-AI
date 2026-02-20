/* import express from "express";
import { register, login } from "../Controllers/HeatAuthController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

export default router;
 */

const express = require("express");
const { register, login } = require("../Controllers/HeatAuthController.js");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);


module.exports = router;