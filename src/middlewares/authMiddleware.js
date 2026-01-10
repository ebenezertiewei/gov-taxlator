const jwt = require("jsonwebtoken");
const User = require("../models/authModels"); // your User model

const protect = async (req, res, next) => {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ success: false, message: "Not authorized" });
	}

	const token = authHeader.split(" ")[1];

	try {
	const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
		const user = await User.findById(decoded.id).select("-password");
		if (!user) {
			return res
				.status(401)
				.json({ success: false, message: "User not found" });
		}

		req.user = user; // attach user to request
		next();
	} catch (err) {
		return res.status(401).json({ success: false, message: "Token invalid" });
	}
};

module.exports = protect;
