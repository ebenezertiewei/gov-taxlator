// src/utils/calcHandler.js
const jwt = require("jsonwebtoken");
const User = require("../models/authModels");

/**
 * Dual-purpose calculation handler
 * @param {Function} calculationFn - function to perform calculation (tax or VAT)
 */
const handleCalculation = (calculationFn) => async (req, res) => {
	try {
		let user = null;

		// Try to identify user via JWT
		const authHeader = req.headers.authorization;
		if (authHeader?.startsWith("Bearer ")) {
			try {
				const token = authHeader.split(" ")[1];
				const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
				user = await User.findById(decoded.id).select("-password");
				if (!user || !user.verified) user = null;
			} catch {
				user = null;
			}
		}

		// Perform calculation
		const result = await calculationFn(req.body);

		// Save record only if user exists
		if (user) {
			result.user = user._id;
			await result.save();
		}

		res.status(200).json({
			success: true,
			result,
			saved: !!user, // indicates if record was saved
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

module.exports = handleCalculation;
