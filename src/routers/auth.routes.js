// src/routers/auth.routes.js
const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

// Sample route for authentication
router.post("/signup", authController.signup);
router.post("/signin", authController.signin);
router.post("/signout", authController.signout);

module.exports = router;
