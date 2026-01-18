// src/models/authModels.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
	{
		firstName: {
			type: String,
			required: true,
			trim: true,
			minlength: 2,
			maxlength: 30,
		},
		lastName: {
			type: String,
			required: true,
			trim: true,
			minlength: 2,
			maxlength: 30,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
		},
		password: {
			type: String,
			required: true,
			minlength: 8,
			select: false,
		},

		/* ================= PROFILE ================= */
		avatarUrl: {
			type: String,
			default: null,
		},

		/* ================= SETTINGS ================= */
		language: {
			type: String,
			default: "English",
		},
		theme: {
			type: String,
			enum: ["Light", "Dark"],
			default: "Light",
		},
		notifications: {
			type: Boolean,
			default: true,
		},

		/* ================= AUTH ================= */
		verified: { type: Boolean, default: false },
		verificationCode: { type: String },
		verificationExpires: { type: Date },
		forgotPasswordCode: { type: String, select: false },
		forgotPasswordCodeValidation: { type: Number, select: false },
	},
	{ timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
