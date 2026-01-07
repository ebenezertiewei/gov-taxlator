// src/services/freelancer.service.js

// 1️⃣ Import the tax bands first
const PAYE_TAX_BANDS = require("../utils/taxBands");

// 2️⃣ Import any other utilities
const {
	normalizeAnnualIncome,
	calculateTaxableIncome,
} = require("../utils/tax/freelancer.util");

/**
 * Calculate Freelancer / Self-Employed Tax
 */
const calculateFreelancerTax = async ({
	grossIncome,
	frequency = "annual",
	expenses = 0,
}) => {
	// 1. Normalize income
	const annualGrossIncome = normalizeAnnualIncome(grossIncome, frequency);

	// 2. Calculate taxable income
	const taxableIncome = calculateTaxableIncome(annualGrossIncome, expenses);

	let remainingIncome = taxableIncome;
	let totalTax = 0;
	const breakdown = [];

	// 3. Apply progressive tax bands
	for (const band of PAYE_TAX_BANDS) {
		if (remainingIncome <= 0) break;

		const taxableAmount = Math.min(remainingIncome, band.limit);
		const taxForBand = taxableAmount * band.rate;

		breakdown.push({
			rate: band.rate,
			taxableAmount,
			tax: Number(taxForBand.toFixed(2)),
		});

		totalTax += taxForBand;
		remainingIncome -= taxableAmount;
	}

	return {
		grossIncome,
		expenses,
		frequency,
		annualGrossIncome,
		taxableIncome,
		totalAnnualTax: Number(totalTax.toFixed(2)),
		monthlyTax: Number((totalTax / 12).toFixed(2)),
		breakdown,
	};
};

module.exports = {
	calculateFreelancerTax,
};
