const vatRequestSchema = require("../middlewares/vatValidator");
const { calculateVATService } = require("../services/vat.service");

/**
 * POST /api/vat/calculate
 */
const calculateVAT = async (req, res, next) => {
	try {
		const { value, error } = vatRequestSchema.validate(req.body);

		if (error) {
			return res.status(400).json({
				success: false,
				error: error.details[0].message,
			});
		}

		const result = calculateVATService(value);

		return res.status(200).json({
			success: true,
			data: result,
		});
	} catch (err) {
		next(err);
	}
};

module.exports = { calculateVAT };
