// src/routers/profile.routes.js
import express from "express";
import User from "../models/authModels";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = express.Router();

/* ================= GET PROFILE ================= */
router.get("/", authMiddleware, async (req, res) => {
	const user = await User.findById(req.user._id).select(
		"firstName lastName email avatarUrl language theme notifications"
	);
	res.json(user);
});

/* ================= UPDATE PROFILE ================= */
router.put("/", authMiddleware, async (req, res) => {
	const { firstName, lastName, avatarUrl, language, theme, notifications } =
		req.body;

	const user = await User.findByIdAndUpdate(
		req.user._id,
		{
			firstName,
			lastName,
			avatarUrl,
			language,
			theme,
			notifications,
		},
		{ new: true }
	).select("firstName lastName email avatarUrl language theme notifications");

	res.json(user);
});

export default router;
