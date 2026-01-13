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
		if (error) {
			return res.status(401).json({
				success: false,
				message: error.details[0].message,
			});
		}

		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(401).json({
				success: false,
				message: "User already exists",
			});
		}

		const hashedPassword = await doHash(password, 12);

		const newUser = new User({
			firstName,
			lastName,
			email,
			password: hashedPassword,
		});

		const result = await newUser.save();
		result.password = undefined;

		res.status(201).json({
			success: true,
			message: "Account created successfully",
			result,
		});
	} catch (error) {
		console.log(error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

/* ================= SIGNIN ================= */
exports.signin = async (req, res) => {
	const { email, password } = req.body;

	try {
		const { error } = signinSchema.validate({ email, password });
		if (error) {
			return res.status(401).json({
				success: false,
				message: error.details[0].message,
			});
		}

		const user = await User.findOne({ email }).select("+password");
		if (!user) {
			return res.status(401).json({
				success: false,
				message: "User does not exist",
			});
		}

		const isValid = await doHashValidation(password, user.password);
		if (!isValid) {
			return res.status(401).json({
				success: false,
				message: "Invalid credentials",
			});
		}
		const token = jwt.sign(
			{
				id: user._id,
			},
			process.env.TOKEN_SECRET,
			{ expiresIn: "8h" }
		);

		res.cookie("Authorization", "Bearer " + token, {
			expires: new Date(Date.now() + 8 * 60 * 60 * 1000),
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
		});

		res.status(200).json({
			success: true,
			message: "Login successful",
			token,
		});
	} catch (error) {
		console.log(error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

/* ================= SIGNOUT ================= */
exports.signout = async (req, res) => {
	res.clearCookie("Authorization");
	res.status(200).json({
		success: true,
		message: "Logout successful",
	});
};

/* ================= SEND VERIFICATION CODE ================= */
exports.sendVerificationCode = async (req, res) => {
	const { email } = req.body;

	try {
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User does not exist",
			});
		}

		if (user.verified) {
			return res.status(400).json({
				success: false,
				message: "User is already verified",
			});
		}

		// Generate verification code
		const codeValue = Math.floor(Math.random() * 900000).toString();

		const info = await transport.sendMail({
			from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
			to: user.email,
			subject: "Your Verification Code",
			html: `<p>Your verification code is: <b>${codeValue}</b>. It is valid for 15 minutes.</p>`,
		});

		if (!info.accepted || !info.accepted.includes(user.email)) {
			return res.status(500).json({
				success: false,
				message: "Failed to send verification code",
			});
		}

		res.status(200).json({
			success: true,
			message: "Verification code sent successfully",
		});
	} catch (error) {
		console.log(error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};
