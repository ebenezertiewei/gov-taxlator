// src/utils/tax/cit.util.js

/**
 * Nigerian Company Income Tax (CIT) rates
 * SMALL: 0% (<= 50m)
 * MEDIUM: 20% (50m - 300m)
 * LARGE: 30% (> 300m)
 */
const CIT_RATES = {
	SMALL: 0.0,
	MEDIUM: 0.2,
	LARGE: 0.3,
};

module.exports = { CIT_RATES };
