// src/routers/History.routes.js
import express from "express";
import History from "../models/History";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = express.Router();

// Get user history
router.get("/", authMiddleware, async (req, res) => {
	const userId = req.user._id;
	const history = await History.find({ userId }).sort({ createdAt: -1 });
	res.json(history);
});

// Add new history item
router.post("/", authMiddleware, async (req, res) => {
	const { type, input, result } = req.body;
	const userId = req.user._id;
	const newItem = new History({ userId, type, input, result });
	await newItem.save();
	res.json(newItem);
});

// Clear all history
router.delete("/", authMiddleware, async (req, res) => {
	const userId = req.user._id;
	await History.deleteMany({ userId });
	res.json({ message: "History cleared" });
});

export default router;
