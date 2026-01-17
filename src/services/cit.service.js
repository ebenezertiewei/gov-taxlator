// src/services/cit.service.js
const { CIT_RATES } = require("../utils/tax/cit.util");

/**
 * Calculate Company Income Tax (CIT)
 */
async function calculateCIT({ revenue, expenses = 0, companySize }) {
	const rate = CIT_RATES[companySize];

	if (rate === undefined) {
		throw new Error("Invalid company size");
	}

	if (expenses > revenue) {
		throw new Error("Expenses cannot exceed revenue");
	}

	const profit = revenue - expenses;
	const taxPayable = profit * rate;

	return {
		taxType: "CIT",
		companySize,
		revenue,
		expenses,
		profit,
		taxRate: rate,
		taxPayable,
		effectiveTaxRate: rate,
	};
}

module.exports = { calculateCIT };
