// src/controllers/authController.js
const jwt = require("jsonwebtoken");
const { signupSchema, signinSchema } = require("../middlewares/authValidator");
const User = require("../models/authModels");
const { doHash, doHashValidation } = require("../utils/hashing");
const transport = require("../middlewares/sendMail");

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
		if (error)
			return res
				.status(400)
				.json({ success: false, message: error.details[0].message });

		const normalizedEmail = email.toLowerCase();

		// Check if user exists
		const existingUser = await User.findOne({ email: normalizedEmail });
		if (existingUser)
			return res
				.status(400)
				.json({ success: false, message: "User already exists" });

		// Hash password
		const hashedPassword = await doHash(password, 12);

		// ✅ Generate verification code + expiry
		const codeValue = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
		const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

		console.log("Generated verification code:", `"${codeValue}"`);

		// ✅ Create user and save verification code properly
		const newUser = new User({
			firstName,
			lastName,
			email: normalizedEmail,
			password: hashedPassword,
			verificationCode: codeValue,
			verificationExpires,
		});
		await newUser.save();

		// Send verification email asynchronously
		const mailOptions = {
			from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
			to: normalizedEmail,
			subject: "Verify Your Account",
			html: `
        <p>Hello <b>${firstName} ${lastName}</b>,</p>
        <p>You recently signed up for <b>Taxlator</b>. Your verification code is:</p>
        <h2>${codeValue}</h2>
        <p>This code is valid for 15 minutes. If you did not sign up, please ignore this email.</p>
        <p>Thank you,<br>Taxlator Team</p>
      `,
		};

		transport
			.sendMail(mailOptions)
			.then((info) => console.log("✅ Email sent:", info.response))
			.catch((err) => console.error("❌ Email sending failed:", err));

		// Respond to frontend
		res.status(201).json({
			success: true,
			message:
				"Account created. Please check your email for the verification code.",
		});
	} catch (err) {
		console.error("Signup error:", err);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

/* ================= VERIFY EMAIL ================= */
exports.verifyEmail = async (req, res) => {
	const { email, code } = req.body;

	try {
		const normalizedEmail = email.toLowerCase();

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

		console.log("DB code:", `"${user.verificationCode}"`);
		console.log("Input code:", `"${code}"`);

		// Compare verification codes as strings
		if (user.verificationCode?.trim() !== String(code).trim()) {
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

		res
			.status(200)
			.json({ success: true, message: "Email verified successfully" });
	} catch (err) {
		console.error("Verify email error:", err);
		res.status(500).json({ success: false, message: "Server error" });
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

		const normalizedEmail = email.toLowerCase();
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

		res.status(200).json({ success: true, message: "Login successful", token });
	} catch (err) {
		console.error(err);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

/* ================= CHANGE PASSWORD ================= */
exports.changePassword = async (req, res) => {
	const { currentPassword, newPassword } = req.body;
	const userId = req.user?.id; // extracted from JWT middleware

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

		// Verify current password
		const isValid = await doHashValidation(currentPassword, user.password);
		if (!isValid) {
			return res
				.status(400)
				.json({ success: false, message: "Current password is incorrect" });
		}

		// Hash new password
		const hashedPassword = await doHash(newPassword, 12);
		user.password = hashedPassword;

		await user.save();

		res
			.status(200)
			.json({ success: true, message: "Password changed successfully" });
	} catch (err) {
		console.error("Change password error:", err);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

/* ================= FORGOT PASSWORD ================= */
exports.forgotPassword = async (req, res) => {
	const { email } = req.body;

	try {
		const user = await User.findOne({ email: email.toLowerCase() });
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

		// Send code via email
		const info = await transport.sendMail({
			from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
			to: user.email,
			subject: "Reset Your Password",
			html: `
        <p>Hello <b>${user.firstName} ${user.lastName}</b>,</p>
        <p>You requested a password reset. Your verification code is:</p>
        <h2>${forgotCode}</h2>
        <p>This code is valid for 15 minutes. If you did not request this, please ignore this email.</p>
        <p>Thank you,<br>Taxlator Team</p>
      `,
		});

		if (!info.accepted || !info.accepted.includes(user.email)) {
			return res
				.status(500)
				.json({ success: false, message: "Failed to send reset code" });
		}

		res.status(200).json({
			success: true,
			message: "Password reset code sent successfully",
		});
	} catch (err) {
		console.error("Forgot password error:", err);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

/* ================= RESET PASSWORD ================= */
exports.resetPassword = async (req, res) => {
	const { email, code, newPassword } = req.body;

	try {
		const user = await User.findOne({ email: email.toLowerCase() });
		if (!user) {
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		}

		// Validate code and expiry
		if (
			user.forgotPasswordCode !== code ||
			(user.forgotPasswordCodeValidation &&
				user.forgotPasswordCodeValidation < new Date())
		) {
			return res
				.status(400)
				.json({ success: false, message: "Invalid or expired code" });
		}

		// Hash new password
		const hashedPassword = await doHash(newPassword, 12);
		user.password = hashedPassword;

		// Clear reset code
		user.forgotPasswordCode = undefined;
		user.forgotPasswordCodeValidation = undefined;

		await user.save();

		res
			.status(200)
			.json({ success: true, message: "Password reset successfully" });
	} catch (err) {
		console.error("Reset password error:", err);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

/* ================= SIGNOUT ================= */
exports.signout = async (req, res) => {
	res.clearCookie("Authorization");
	res.status(200).json({ success: true, message: "Logout successful" });
};

/* ================= SEND VERIFICATION CODE ================= */
exports.sendVerificationCode = async (req, res) => {
	const { email } = req.body;

	try {
		const normalizedEmail = email.toLowerCase();
		const user = await User.findOne({ email: normalizedEmail });
		if (!user)
			return res
				.status(404)
				.json({ success: false, message: "User does not exist" });

		if (user.verified)
			return res
				.status(400)
				.json({ success: false, message: "User is already verified" });

		// Generate verification code
		const codeValue = Math.floor(100000 + Math.random() * 900000).toString();
		user.verificationCode = codeValue;
		user.verificationExpires = new Date(Date.now() + 15 * 60 * 1000);
		await user.save();

		const info = await transport.sendMail({
			from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
			to: normalizedEmail,
			subject: "Your Verification Code",
			html: `<p>Your verification code is: <b>${codeValue}</b>. It is valid for 15 minutes.</p>`,
		});

		if (!info.accepted || !info.accepted.includes(normalizedEmail)) {
			return res
				.status(500)
				.json({ success: false, message: "Failed to send verification code" });
		}

		res
			.status(200)
			.json({ success: true, message: "Verification code sent successfully" });
	} catch (err) {
		console.error(err);
		res.status(500).json({ success: false, message: "Server error" });
	}
};
