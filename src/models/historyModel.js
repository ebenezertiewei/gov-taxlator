// src/models/History.js
const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
	type: { type: String, required: true },
	input: { type: Object, required: true },
	result: { type: Object, required: true },
	createdAt: { type: Date, default: Date.now, expires: 7 * 24 * 60 * 60 }, // auto-delete after 7 days
});

module.exports = mongoose.model("History", historySchema);
