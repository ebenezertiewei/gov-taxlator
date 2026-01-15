const Joi = require("joi");

/* ================= SIGNUP VALIDATION ================= */
exports.signupSchema = Joi.object({
	firstName: Joi.string().trim().min(2).max(30).required(),

	lastName: Joi.string().trim().min(2).max(30).required(),

	email: Joi.string().trim().lowercase().min(6).max(60).required().email(),

	password: Joi.string()
		.trim()
		.min(8)
		.pattern(
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._])[A-Za-z\d@$!%*?&._]{8,}$/
		)
		.required()
		.messages({
			"string.pattern.base":
				"Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character",
		}),
});

/* ================= SIGNIN VALIDATION ================= */
exports.signinSchema = Joi.object({
	email: Joi.string()
		.min(6)
		.max(60)
		.required()
		.email({
			tlds: { allow: ["com", "net", "org"] },
		})
		.messages({
			"string.empty": "Email is required",
			"string.email": "Email must be a valid email address",
		}),

	password: Joi.string().min(8).required().messages({
		"string.empty": "Password is required",
		"string.min": "Password must be at least 8 characters long",
	}),
});
