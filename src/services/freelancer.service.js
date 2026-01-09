// src/services/freelancer.service.js

// 1️⃣ Import the tax bands
const PAYE_TAX_BANDS = require("../utils/taxBands");

// 2️⃣ Import utility for normalizing income
const { normalizeAnnualIncome } = require("../utils/tax/freelancer.util");

/**
 * Calculate taxable income for freelancer
 */
const calculateTaxableIncome = (
	annualGrossIncome,
	pension = 0,
	expenses = 0
) => {
	// Ensure deductions are numbers
	pension = pension || 0;
	expenses = expenses || 0;

	// Subtract both pension and expenses from gross income
	return annualGrossIncome - pension - expenses;
};

/**
 * Calculate Freelancer / Self-Employed Tax
 */
const calculateFreelancerTax = async ({
	grossIncome,
	frequency = "annual",
	pension = 0,
	expenses = 0,
}) => {
	// 1. Normalize income to annual if needed
	const annualGrossIncome = normalizeAnnualIncome(grossIncome, frequency);

	// 2. Calculate taxable income (now includes pension)
	const taxableIncome = calculateTaxableIncome(
		annualGrossIncome,
		pension,
		expenses
	);

	let remainingIncome = taxableIncome;
	let totalTax = 0;
	const breakdown = [];

	// 3. Apply progressive PAYE tax bands
	for (const band of PAYE_TAX_BANDS) {
		if (remainingIncome <= 0) break;

		// Taxable amount for this band
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
		pension,
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
