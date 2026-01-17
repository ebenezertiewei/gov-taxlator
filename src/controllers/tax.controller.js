// src/controllers/tax.controller.js
const Joi = require("joi");
const payeService = require("../services/payePit.service");
const freelancerService = require("../services/freelancer.service");
const citService = require("../services/cit.service");
const TaxRecord = require("../models/taxRecordModel");

// Validation
const taxRequestSchema = Joi.object({
	taxType: Joi.string().valid("PAYE/PIT", "FREELANCER", "CIT").required(),
	grossIncome: Joi.number().positive().optional(),
	rentRelief: Joi.number().min(0).precision(2).optional(),
	otherDeductions: Joi.number().min(0).precision(2).optional(),
	frequency: Joi.string().valid("monthly", "annual").default("annual"),
	pension: Joi.number().min(0).optional(),
	expenses: Joi.number().min(0).optional(),
	businessExpenses: Joi.number().min(0).optional(),
	companySize: Joi.string().valid("SMALL", "MEDIUM", "LARGE").optional(),
	revenue: Joi.number().positive().optional(),
})
	.unknown(false)
	.custom((value, helpers) => {
		if (value.taxType === "CIT") {
			if (!value.revenue)
				return helpers.error("any.custom", "revenue is required for CIT");
			if (!value.companySize)
				return helpers.error("any.custom", "companySize is required for CIT");
			if (value.expenses && value.expenses > value.revenue)
				return helpers.error("any.custom", "expenses cannot exceed revenue");
		}
		return value;
	});

// Controller
exports.calculateTax = async (req, res, next) => {
	try {
		const { value, error } = taxRequestSchema.validate(req.body);

		if (error) {
			return res
				.status(400)
				.json({ success: false, error: error.details[0].message });
		}

		// ✅ Backward/forward compatibility:
		// If frontend sends `businessExpenses` for CIT, map it to `expenses` (what your service expects).
		if (
			value.taxType === "CIT" &&
			value.expenses == null &&
			value.businessExpenses != null
		) {
			value.expenses = value.businessExpenses;
			delete value.businessExpenses;
		}

		let result;
		switch (value.taxType) {
			case "PAYE/PIT":
				result = await payeService.calculatePAYE(value);
				break;
			case "FREELANCER":
				result = await freelancerService.calculateFreelancerTax(value);
				break;
			case "CIT":
				result = await citService.calculateCIT(value);
				break;
			default:
				return res
					.status(400)
					.json({ success: false, error: "Unsupported tax type" });
		}

		if (req.user) {
			// Save only relevant fields
			const record = {
				userId: req.user._id,
				taxType: value.taxType,
				grossIncome: value.grossIncome,
				frequency: value.frequency,
				expenses: value.expenses,
				revenue: value.revenue,
				companySize: value.companySize,
				...result,
			};
			await TaxRecord.create(record);
		}

		res.status(200).json({ success: true, data: result });
	} catch (err) {
		next(err);
	}
};
