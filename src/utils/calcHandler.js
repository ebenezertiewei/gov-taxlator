// src/utils/calcHandler.js
const jwt = require("jsonwebtoken");
const User = require("../models/authModels");

const handleCalculation = (controllerFn) => async (req, res, next) => {
	try {
		req.user = null;

		const authHeader = req.headers.authorization;
		if (authHeader?.startsWith("Bearer ")) {
			try {
				const token = authHeader.split(" ")[1];
				const decoded = jwt.verify(token, process.env.TOKEN_SECRET);

				const user = await User.findById(decoded.id).select("-password");
				if (user && user.verified) req.user = user;
			} catch {
				req.user = null;
			}
		}

		return controllerFn(req, res, next);
	} catch (err) {
		return next(err);
	}
};

module.exports = handleCalculation;
