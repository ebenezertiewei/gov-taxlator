// src/routers/auth.routes.js
const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

// Authentication routes
router.post("/signup", authController.signup);
router.post("/signin", authController.signin);
router.post("/changePassword", authMiddleware, authController.changePassword);
router.post("/forgotPassword", authController.forgotPassword);
router.post("/resetPassword", authController.resetPassword);
router.post("/signout", authController.signout);

// Email verification routes
router.post("/verifyEmail", authController.verifyEmail);
router.post("/sendVerificationCode", authController.sendVerificationCode);

module.exports = router;
