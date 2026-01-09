// src/controllers/tax.controller.js
const Joi = require("joi");
const payeService = require("../services/payePit.service");
const vatService = require("../services/vat.service");
const freelancerService = require("../services/freelancer.service");
const citService = require("../services/cit.service");

/**
 * Validation schema
 */
const taxRequestSchema = Joi.object({
	taxType: Joi.string()
		.valid("PAYE/PIT", "VAT", "FREELANCER", "CIT")
		.required(),

	// PAYE/PIT, FREELANCER
	grossIncome: Joi.number().positive().optional(),
	rentRelief: Joi.number().min(0).precision(2).optional(),
	otherDeductions: Joi.number().min(0).precision(2).optional(),

	// FREELANCER monthly should automatically be calculated by 12 months
	frequency: Joi.string().valid("monthly", "annual").default("annual"),

	// PAYE/PIT to be calculated by 8% of gross income
	pension: Joi.number().min(0).optional(),

	// FREELANCER & PAYE/PIT
	pension: Joi.number().min(0).optional(),

	// FREELANCER & CIT
	expenses: Joi.number().min(0).optional(),

	// VAT
	amount: Joi.number().positive().optional(),

	// CIT
	companySize: Joi.string().valid("SMALL", "MEDIUM", "LARGE").optional(),
	revenue: Joi.number().positive().optional(),
})
	.unknown(false) // ⛔ Block unexpected fields (e.g. profit)
	.custom((value, helpers) => {
		// CIT-specific rules
		if (value.taxType === "CIT") {
			if (value.revenue === undefined) {
				return helpers.error("any.custom", "revenue is required for CIT");
			}

			if (value.companySize === undefined) {
				return helpers.error("any.custom", "companySize is required for CIT");
			}

			if (value.expenses !== undefined && value.expenses > value.revenue) {
				return helpers.error("any.custom", "expenses cannot exceed revenue");
			}
		}

		return value;
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
			case "PAYE/PIT":
				result = await payeService.calculatePAYE(value);
				break;

			case "FREELANCER":
				result = await freelancerService.calculateFreelancerTax({
					grossIncome: value.grossIncome,
					frequency: value.frequency,
					expenses: value.expenses || 0,
					pension: value.pension || 0,
				});
				break;

			case "CIT":
				result = await citService.calculateCIT({
					revenue: value.revenue,
					companySize: value.companySize,
					expenses: value.expenses || 0,
				});
				break;

			default:
				return res.status(400).json({
					success: false,
					error: "Unsupported tax type",
				});
		}

		return res.status(200).json({
			success: true,
			data: result,
		});
	} catch (err) {
		next(err);
	}
};
