// src/controllers/authController.js
const jwt = require("jsonwebtoken");
const { signupSchema, signinSchema } = require("../middlewares/authValidator");
const User = require("../models/authModels");
const { doHash, doHashValidation } = require("../utils/hashing");
const { sendGmail } = require("../services/gmailApiMailer");

/* ================= SIGNUP ================= */
exports.signup = async (req, res) => {
	const { firstName, lastName, email, password } = req.body;

	try {
		// Validate input
		const { error } = signupSchema.validate({
			firstName,
			lastName,
			email,
			password,
		});
		if (error) {
			return res
				.status(400)
				.json({ success: false, message: error.details[0].message });
		}

		const normalizedEmail = String(email).trim().toLowerCase();

		// Check if user exists
		const existingUser = await User.findOne({ email: normalizedEmail });
		if (existingUser) {
			return res
				.status(400)
				.json({ success: false, message: "User already exists" });
		}

		// Hash password
		const hashedPassword = await doHash(password, 12);

		// Generate verification code + expiry
		const codeValue = Math.floor(100000 + Math.random() * 900000).toString();
		const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

		// Create user
		const newUser = new User({
			firstName,
			lastName,
			email: normalizedEmail,
			password: hashedPassword,
			verificationCode: codeValue,
			verificationExpires,
			verified: false,
		});
		await newUser.save();

		// Try to send email, but don't block signup if it fails
		let emailSent = true;
		try {
			await sendGmail({
				to: normalizedEmail,
				subject: "Verify Your Account",
				text: `Hello ${firstName} ${lastName}, your verification code is ${codeValue}. This code is valid for 15 minutes.`,
				html: `
          		<p>Hello <b>${firstName} ${lastName}</b>,</p>
        	 	 <p>You recently signed up for <b>Taxlator</b>. Your verification code is:</p>
        	 	 <h2>${codeValue}</h2>
         	 	<p>This code is valid for 15 minutes. If you did not sign up, please ignore this email.</p>
         	 	<p>Thank you,<br/>Taxlator Team</p>
        		`,
			});
		} catch (mailErr) {
			emailSent = false;
			console.error(
				"❌ Signup email sending failed:",
				mailErr?.message || mailErr
			);
			// Optional: you can also keep an "emailSendFailedAt" timestamp on the user for retry logic
		}

		return res.status(201).json({
			success: true,
			message:
				"Account created. Please check your email for the verification code.",
			emailSent,
		});
	} catch (err) {
		console.error("Signup error:", err);
		return res.status(500).json({
			success: false,
			message: "Server error",
		});
	}
};

/* ================= VERIFY EMAIL ================= */
exports.verifyEmail = async (req, res) => {
	const { email, code } = req.body;

	try {
		const normalizedEmail = String(email).trim().toLowerCase();

		// Select verificationCode and verificationExpires explicitly
		const user = await User.findOne({ email: normalizedEmail }).select(
			"+verificationCode +verificationExpires"
		);

		if (!user)
			return res
				.status(404)
				.json({ success: false, message: "User not found" });

		if (user.verified)
			return res
				.status(400)
				.json({ success: false, message: "User already verified" });

		// Compare verification codes as strings
		if (String(user.verificationCode || "").trim() !== String(code).trim()) {
			return res
				.status(400)
				.json({ success: false, message: "Invalid verification code" });
		}

		// Check expiry
		if (user.verificationExpires && user.verificationExpires < new Date()) {
			return res
				.status(400)
				.json({ success: false, message: "Verification code expired" });
		}

		// Mark verified
		user.verified = true;
		user.verificationCode = undefined;
		user.verificationExpires = undefined;
		await user.save();

		return res
			.status(200)
			.json({ success: true, message: "Email verified successfully" });
	} catch (err) {
		console.error("Verify email error:", err);
		return res.status(500).json({ success: false, message: "Server error" });
	}
};

/* ================= SIGNIN ================= */
exports.signin = async (req, res) => {
	const { email, password } = req.body;

	try {
		const { error } = signinSchema.validate({ email, password });
		if (error)
			return res
				.status(400)
				.json({ success: false, message: error.details[0].message });

		const normalizedEmail = String(email).trim().toLowerCase();

		const user = await User.findOne({ email: normalizedEmail }).select(
			"+password"
		);

		if (!user)
			return res
				.status(401)
				.json({ success: false, message: "User does not exist" });

		const isValid = await doHashValidation(password, user.password);
		if (!isValid)
			return res
				.status(401)
				.json({ success: false, message: "Invalid credentials" });

		if (!user.verified)
			return res
				.status(403)
				.json({ success: false, message: "Email not verified" });

		const token = jwt.sign({ id: user._id }, process.env.TOKEN_SECRET, {
			expiresIn: "8h",
		});

		res.cookie("Authorization", "Bearer " + token, {
			expires: new Date(Date.now() + 8 * 60 * 60 * 1000),
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
		});

		return res
			.status(200)
			.json({ success: true, message: "Login successful", token });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ success: false, message: "Server error" });
	}
};

/* ================= CHANGE PASSWORD ================= */
exports.changePassword = async (req, res) => {
	const { currentPassword, newPassword } = req.body;
	const userId = req.user?.id;

	if (!userId) {
		return res.status(401).json({ success: false, message: "Unauthorized" });
	}

	try {
		const user = await User.findById(userId).select("+password");
		if (!user) {
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		}

		const isValid = await doHashValidation(currentPassword, user.password);
		if (!isValid) {
			return res
				.status(400)
				.json({ success: false, message: "Current password is incorrect" });
		}

		const hashedPassword = await doHash(newPassword, 12);
		user.password = hashedPassword;

		await user.save();

		return res
			.status(200)
			.json({ success: true, message: "Password changed successfully" });
	} catch (err) {
		console.error("Change password error:", err);
		return res.status(500).json({ success: false, message: "Server error" });
	}
};

/* ================= FORGOT PASSWORD ================= */
exports.forgotPassword = async (req, res) => {
	const { email } = req.body;

	try {
		const normalizedEmail = String(email).trim().toLowerCase();

		const user = await User.findOne({ email: normalizedEmail });
		if (!user) {
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		}

		// Generate temporary code (6-digit)
		const forgotCode = Math.floor(100000 + Math.random() * 900000).toString();
		const forgotCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min

		user.forgotPasswordCode = forgotCode;
		user.forgotPasswordCodeValidation = forgotCodeExpires;
		await user.save();

		// Try to send email, but don't fail the endpoint if it fails
		let emailSent = true;
		try {
			await sendGmail({
				to: user.email,
				subject: "Reset Your Password",
				text: `Hello ${user.firstName} ${user.lastName}, your password reset code is ${forgotCode}. This code is valid for 15 minutes.`,
				html: `
          <p>Hello <b>${user.firstName} ${user.lastName}</b>,</p>
          <p>You requested a password reset. Your verification code is:</p>
          <h2>${forgotCode}</h2>
          <p>This code is valid for 15 minutes. If you did not request this, please ignore this email.</p>
          <p>Thank you,<br/>Taxlator Team</p>
        `,
			});
		} catch (mailErr) {
			emailSent = false;
			console.error(
				"❌ Forgot password email sending failed:",
				mailErr?.message || mailErr
			);
		}

		return res.status(200).json({
			success: true,
			message: emailSent
				? "Password reset code sent successfully"
				: "Password reset code generated, but email delivery failed. Please try again.",
			emailSent,
		});
	} catch (err) {
		console.error("Forgot password error:", err);
		return res.status(500).json({ success: false, message: "Server error" });
	}
};

/* ================= RESET PASSWORD ================= */
exports.resetPassword = async (req, res) => {
	const { email, code, newPassword } = req.body;

	try {
		const normalizedEmail = String(email).trim().toLowerCase();

		const user = await User.findOne({ email: normalizedEmail });
		if (!user) {
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		}

		if (
			String(user.forgotPasswordCode || "").trim() !== String(code).trim() ||
			(user.forgotPasswordCodeValidation &&
				user.forgotPasswordCodeValidation < new Date())
		) {
			return res
				.status(400)
				.json({ success: false, message: "Invalid or expired code" });
		}

		const hashedPassword = await doHash(newPassword, 12);
		user.password = hashedPassword;

		user.forgotPasswordCode = undefined;
		user.forgotPasswordCodeValidation = undefined;

		await user.save();

		return res
			.status(200)
			.json({ success: true, message: "Password reset successfully" });
	} catch (err) {
		console.error("Reset password error:", err);
		return res.status(500).json({ success: false, message: "Server error" });
	}
};

/* ================= SIGNOUT ================= */
exports.signout = async (req, res) => {
	res.clearCookie("Authorization");
	return res.status(200).json({ success: true, message: "Logout successful" });
};

/* ================= SEND VERIFICATION CODE ================= */
exports.sendVerificationCode = async (req, res) => {
	const { email } = req.body;

	try {
		const normalizedEmail = String(email).trim().toLowerCase();

		const user = await User.findOne({ email: normalizedEmail });
		if (!user) {
			return res
				.status(404)
				.json({ success: false, message: "User does not exist" });
		}

		if (user.verified) {
			return res
				.status(400)
				.json({ success: false, message: "User is already verified" });
		}

		// Generate verification code
		const codeValue = Math.floor(100000 + Math.random() * 900000).toString();
		user.verificationCode = codeValue;
		user.verificationExpires = new Date(Date.now() + 15 * 60 * 1000);
		await user.save();

		// Try to send email, but don't fail the endpoint if it fails
		let emailSent = true;
		try {
			await sendGmail({
				to: normalizedEmail,
				subject: "Your Verification Code",
				text: `Your verification code is: ${codeValue}. It is valid for 15 minutes.`,
				html: `<p>Your verification code is: <b>${codeValue}</b>. It is valid for 15 minutes.</p>`,
			});
		} catch (mailErr) {
			emailSent = false;
			console.error(
				"❌ Verification code email sending failed:",
				mailErr?.message || mailErr
			);
		}

		return res.status(200).json({
			success: true,
			message: emailSent
				? "Verification code sent successfully"
				: "Verification code generated, but email delivery failed. Please try again.",
			emailSent,
		});
	} catch (err) {
		console.error("Send verification code error:", err);
		return res.status(500).json({ success: false, message: "Server error" });
	}
};
