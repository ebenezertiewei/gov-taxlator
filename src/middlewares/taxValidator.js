const Joi = require("joi");

exports.taxRequestSchema = Joi.object({
	taxType: Joi.string().valid("PAYE/PIT", "FREELANCER", "CIT").required(),
	frequency: Joi.string().valid("monthly", "annual").default("annual"),

	// PAYE/PIT & FREELANCER
	grossIncome: Joi.number().positive().precision(2).when("taxType", {
		is: "CIT",
		then: Joi.optional(),
		otherwise: Joi.required(),
	}),

	// PAYE/PIT-only deductions
	rentRelief: Joi.number().min(0).precision(2).when("taxType", {
		is: "PAYE/PIT",
		then: Joi.optional(),
		otherwise: Joi.forbidden(),
	}),
	otherDeductions: Joi.number().min(0).precision(2).when("taxType", {
		is: "PAYE/PIT",
		then: Joi.optional(),
		otherwise: Joi.forbidden(),
	}),

	// FREELANCER-only
	pension: Joi.boolean().default(true).when("taxType", {
		is: "FREELANCER",
		then: Joi.optional(),
		otherwise: Joi.forbidden(),
	}),
	expenses: Joi.number()
		.min(0)
		.precision(2)
		.when("taxType", {
			is: Joi.valid("FREELANCER", "CIT"),
			then: Joi.optional(),
			otherwise: Joi.forbidden(),
		}),

	// CIT-only
	revenue: Joi.number().positive().precision(2).when("taxType", {
		is: "CIT",
		then: Joi.required(),
		otherwise: Joi.forbidden(),
	}),
	companySize: Joi.string().valid("SMALL", "MEDIUM", "LARGE").when("taxType", {
		is: "CIT",
		then: Joi.required(),
		otherwise: Joi.forbidden(),
	}),
}).unknown(false);
