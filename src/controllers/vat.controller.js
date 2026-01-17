// src/controllers/vat.controller.js
const vatRequestSchema = require("../middlewares/vatValidator");
const { calculateVATService } = require("../services/vat.service");
const VATRecord = require("../models/vatRecordModel");

exports.calculateVAT = async (req, res, next) => {
	try {
		const { value, error } = vatRequestSchema.validate(req.body);
		if (error)
			return res
				.status(400)
				.json({ success: false, error: error.details[0].message });

		const result = calculateVATService(value);

		// Save record for logged-in user
		if (req.user) {
			await VATRecord.create({ ...value, ...result, userId: req.user._id });
		}

		res.status(200).json({ success: true, data: result });
	} catch (err) {
		next(err);
	}
};
