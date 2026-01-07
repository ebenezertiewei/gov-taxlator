// src/utils/freelancer.utils.js

/**
 * Normalize income to annual value
 */
const normalizeAnnualIncome = (income, period = "annual") => {
	return period === "monthly" ? income * 12 : income;
};

/**
 * Calculate taxable income after expenses
 */
const calculateTaxableIncome = (grossIncome, expenses = 0) => {
	const taxable = grossIncome - expenses;
	return taxable > 0 ? taxable : 0;
};

module.exports = {
	normalizeAnnualIncome,
	calculateTaxableIncome,
};
