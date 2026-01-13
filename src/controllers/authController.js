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
		const existingUser = await User.findOne({ email: normalizedEmail });
		if (existingUser)
			return res
				.status(400)
				.json({ success: false, message: "User already exists" });

		const hashedPassword = await doHash(password, 12);

		const codeValue = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
		const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

		const newUser = new User({
			firstName,
			lastName,
			email: normalizedEmail,
			password: hashedPassword,
			verificationCode: codeValue,
			verificationExpires,
		});

		await newUser.save();

		// Send verification email
		await transport.sendMail({
			from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
			to: normalizedEmail,
			subject: "Verify Your Account",
			html: `<p>Your verification code is: <b>${codeValue}</b>. It is valid for 15 minutes.</p>`,
		});

		res.status(201).json({
			success: true,
			message:
				"Account created. Please check your email for the verification code.",
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

/* ================= EMAIL VERIFICATION ================= */
exports.verifyEmail = async (req, res) => {
	const { email, code } = req.body;

	try {
		const normalizedEmail = email.toLowerCase();
		const user = await User.findOne({ email: normalizedEmail });
		if (!user)
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		if (user.verified)
			return res
				.status(400)
				.json({ success: false, message: "User already verified" });

		if (
			user.verificationCode !== code ||
			user.verificationExpires < new Date()
		) {
			return res.status(400).json({
				success: false,
				message: "Invalid or expired verification code",
			});
		}

		user.verified = true;
		user.verificationCode = undefined;
		user.verificationExpires = undefined;
		await user.save();

		res
			.status(200)
			.json({ success: true, message: "Email verified successfully" });
	} catch (err) {
		console.error(err);
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
