// src/middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/authModels");

const getBearerToken = (req) => {
	// 1) Standard Authorization header
	const header = req.headers.authorization;
	if (header && header.startsWith("Bearer ")) {
		return header.split(" ")[1];
	}

	// 2) Cookie fallback (you set this cookie in signin)
	const cookieVal = req.cookies?.Authorization;
	if (
		cookieVal &&
		typeof cookieVal === "string" &&
		cookieVal.startsWith("Bearer ")
	) {
		return cookieVal.split(" ")[1];
	}

	return null;
};

const protect = async (req, res, next) => {
	const token = getBearerToken(req);

	if (!token) {
		return res.status(401).json({ success: false, message: "Not authorized" });
	}

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
		return next();
	} catch (err) {
		if (err?.name === "TokenExpiredError") {
			return res.status(401).json({ success: false, message: "Token expired" });
		}
		return res.status(401).json({ success: false, message: "Invalid token" });
	}
};

module.exports = protect;
