/**
 * Nigerian Company Income Tax (CIT) rates
 */
const CIT_RATES = {
	SMALL: 0.0,
	MEDIUM: 0.2,
	LARGE: 0.3,
	// small: 50 million Naira and below → 0%
	// medium: 50 million to 300 million Naira → 20%
	// large: above 300 million Naira → 30%
};

module.exports = { CIT_RATES };
