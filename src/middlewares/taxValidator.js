const Joi = require("joi");

exports.taxRequestSchema = Joi.object({
	taxType: Joi.string().valid("PAYE/PIT", "FREELANCER", "CIT").required(),

	// PAYE/PIT
	grossIncome: Joi.number().positive().precision(2).required(),
	rentRelief: Joi.number().min(0).precision(2).optional(),
	otherDeductions: Joi.number().min(0).precision(2).optional(),

	frequency: Joi.string().valid("monthly", "annual").default("annual"),

	//   FREELANCER
	pension: Joi.boolean().default(true),

	// FREELANCER & CIT
	expenses: Joi.number().min(0).precision(2).optional(),
}).custom((value, helpers) => {
	return value;
});
