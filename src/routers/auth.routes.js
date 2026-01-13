// src/routers/auth.routes.js
const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Auth routes
router.post("/signup", authController.signup);
router.post("/signin", authController.signin);
router.post("/signout", authController.signout);

router.post("/verifyEmail", authController.verifyEmail);
router.post("/sendVerificationCode", authController.sendVerificationCode);

// Protected routes
router.post("/changePassword", authMiddleware, authController.changePassword);

router.post("/forgotPassword", authController.forgotPassword);
router.post("/resetPassword", authController.resetPassword);

module.exports = router;
