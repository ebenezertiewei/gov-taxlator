// src/middlewares/vatValidator.js
const Joi = require("joi");

/**
 * VAT Request Schema
 */
const vatRequestSchema = Joi.object({
	transactionAmount: Joi.number().positive().required(),
	calculationType: Joi.string().valid("add", "remove").required(),
	transactionType: Joi.string()
		.valid(
			"Domestic sale/Purchase",
			"Digital Services",
			"Export/International",
			"Exempt"
		)
		.required(),
});

module.exports = vatRequestSchema;
