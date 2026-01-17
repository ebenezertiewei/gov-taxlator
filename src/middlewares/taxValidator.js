// src/middlewares/taxValidator.js
const Joi = require("joi");

exports.taxRequestSchema = Joi.object({
	taxType: Joi.string().valid("PAYE/PIT", "FREELANCER", "CIT").required(),
	frequency: Joi.string().valid("monthly", "annual").default("annual"),

	// PAYE/PIT & FREELANCER
	grossIncome: Joi.number().positive().precision(2).when("taxType", {
		is: "CIT",
		then: Joi.forbidden(),
		otherwise: Joi.required(),
	}),

	// PAYE/PIT-only
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

	// FREELANCER-only (NOTE: your backend service expects pension NUMBER, not boolean)
	pension: Joi.number().min(0).precision(2).when("taxType", {
		is: "FREELANCER",
		then: Joi.optional(),
		otherwise: Joi.forbidden(),
	}),

	// Shared field used by FREELANCER & CIT
	expenses: Joi.number()
		.min(0)
		.precision(2)
		.when("taxType", {
			is: Joi.valid("FREELANCER", "CIT"),
			then: Joi.optional(),
			otherwise: Joi.forbidden(),
		}),

	// ✅ Alias for CIT to match frontend naming
	businessExpenses: Joi.number().min(0).precision(2).when("taxType", {
		is: "CIT",
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
	businessExpenses: Joi.number().min(0).optional().when("taxType", {
		is: "CIT",
		then: Joi.optional(),
		otherwise: Joi.forbidden(),
	}),
}).unknown(false);
