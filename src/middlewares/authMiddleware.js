// src/middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/authModels");

const protect = async (req, res, next) => {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ success: false, message: "Not authorized" });
	}

	const token = authHeader.split(" ")[1];

	try {
		if (!process.env.TOKEN_SECRET) {
			throw new Error("TOKEN_SECRET missing");
		}

		const decoded = jwt.verify(token, process.env.TOKEN_SECRET);

		if (!decoded?.id) {
			return res
				.status(401)
				.json({ success: false, message: "Invalid token payload" });
		}

		const user = await User.findById(decoded.id).select("-password");
		if (!user) {
			return res
				.status(401)
				.json({ success: false, message: "User not found" });
		}

		req.user = user;
		next();
	} catch (err) {
		if (err.name === "TokenExpiredError") {
			return res.status(401).json({ success: false, message: "Token expired" });
		}

		return res.status(401).json({ success: false, message: "Invalid token" });
	}
};

module.exports = protect;
