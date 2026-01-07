// src/services/paye.service.js
const PAYE_TAX_BANDS = require("../utils/taxBands");
// -----------------------
console.log("PAYE_TAX_BANDS:", PAYE_TAX_BANDS);
console.log("Is Array:", Array.isArray(PAYE_TAX_BANDS));
// -----------------------

/**
 * Calculate PAYE Tax (Nigeria)
 */
const calculatePAYE = async ({
	grossIncome,
	frequency = "annual",
	pension = true,
	nhis = true,
	nhf = true,
}) => {
	// 1. Normalize income to annual
	const annualIncome = frequency === "monthly" ? grossIncome * 12 : grossIncome;

	// 2. Statutory deductions
	const pensionDeduction = pension ? annualIncome * 0.08 : 0;
	const nhisDeduction = nhis ? annualIncome * 0.1 : 0;
	const nhfDeduction = nhf ? annualIncome * 0.025 : 0;

	const statutoryDeductions = pensionDeduction + nhisDeduction + nhfDeduction;

	// 3. Consolidated Relief Allowance (CRA)
	const CRA = annualIncome * 0.2 + 200000;

	// 4. Taxable income
	const taxableIncome = Math.max(annualIncome - CRA - statutoryDeductions, 0);

	// 5. Apply PAYE tax bands
	let remainingIncome = taxableIncome;
	let totalTax = 0;
	const breakdown = [];

	for (const band of PAYE_TAX_BANDS) {
		if (remainingIncome <= 0) break;

		const taxableAmount = Math.min(remainingIncome, band.limit);
		const taxForBand = taxableAmount * band.rate;

		breakdown.push({
			bandLimit: band.limit,
			rate: band.rate,
			taxableAmount,
			tax: Number(taxForBand.toFixed(2)),
		});

		totalTax += taxForBand;
		remainingIncome -= taxableAmount;
	}

	// 6. Monthly tax (for UI)
	const monthlyTax = totalTax / 12;

	return {
		grossIncome: annualIncome,
		frequency,
		deductions: {
			pension: pensionDeduction,
			nhis: nhisDeduction,
			nhf: nhfDeduction,
			CRA,
		},
		taxableIncome,
		totalAnnualTax: Number(totalTax.toFixed(2)),
		monthlyTax: Number(monthlyTax.toFixed(2)),
		breakdown,
		effectiveTaxRate:
			annualIncome > 0 ? +(totalTax / annualIncome).toFixed(3) : 0,
	};
};

module.exports = {
	calculatePAYE,
};
