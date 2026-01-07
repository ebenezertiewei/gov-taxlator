const Joi = require("joi");
const payeService = require("../services/paye.service");
const vatService = require("../services/vat.service");
const freelancerService = require("../services/freelancer.service");
const pitService = require("../services/pit.service");

/**
 * Validation schema
 */
const taxRequestSchema = Joi.object({
	taxType: Joi.string().valid("PAYE", "VAT", "FREELANCER", "PIT").required(),

	// PAYE & FREELANCER
	grossIncome: Joi.number().positive().optional(),
	frequency: Joi.string().valid("monthly", "annual").default("annual"),

	// FREELANCER only
	expenses: Joi.number().min(0).optional(),

	// VAT only
	amount: Joi.number().positive().optional(),
});

/**
 * POST /api/tax/calculate
 */
exports.calculateTax = async (req, res, next) => {
	try {
		const { value, error } = taxRequestSchema.validate(req.body);

		if (error) {
			return res.status(400).json({
				success: false,
				error: error.details[0].message,
			});
		}

		let result;

		switch (value.taxType) {
			case "PAYE":
				result = await payeService.calculatePAYE(value);
				break;

			case "VAT":
				result = await vatService.calculateVAT({
					amount: value.amount,
				});
				break;

			case "FREELANCER":
				result = await freelancerService.calculateFreelancerTax({
					grossIncome: value.grossIncome,
					frequency: value.frequency,
					expenses: value.expenses || 0,
				});
				break;

			case "PIT":
				result = await pitService.calculatePIT({
					grossIncome: value.grossIncome,
					frequency: value.frequency,
				});
				break;

			default:
				return res.status(400).json({
					success: false,
					error: "Unsupported tax type",
				});
		}

		res.status(200).json({
			success: true,
			data: result,
		});
	} catch (err) {
		next(err);
	}
};
