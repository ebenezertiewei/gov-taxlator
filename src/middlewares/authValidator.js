const Joi = require('joi');

/* ================= SIGNUP VALIDATION ================= */
exports.signupSchema = Joi.object({
  firstName: Joi.string()
    .min(2)
    .max(30)
    .required()
    .messages({
      'string.empty': 'First name is required',
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name must be at most 30 characters'
    }),

  lastName: Joi.string()
    .min(2)
    .max(30)
    .required()
    .messages({
      'string.empty': 'Last name is required',
      'string.min': 'Last name must be at least 2 characters',
      'string.max': 'Last name must be at most 30 characters'
    }),

  email: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: { allow: ['com', 'net', 'org'] }
    })
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Email must be a valid email address'
    }),

  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._])[A-Za-z\d@$!%*?&]{8,}$/)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character'
    })
});

/* ================= SIGNIN VALIDATION ================= */
exports.signinSchema = Joi.object({
  email: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: { allow: ['com', 'net', 'org'] }
    })
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Email must be a valid email address'
    }),

  password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters long'
    })
});
