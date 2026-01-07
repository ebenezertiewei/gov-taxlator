// src/services/pit.service.js

const PAYE_TAX_BANDS = require("../utils/taxBands");
const { normalizeAnnualIncome } = require("../utils/tax/normalize");

/**
 * Personal Income Tax (Non-PAYE Individuals)
 */
const calculatePIT = async ({ grossIncome, frequency = "annual" }) => {
	if (!Array.isArray(PAYE_TAX_BANDS)) {
		throw new Error("PAYE_TAX_BANDS must be an array");
	}

	// 1. Normalize income
	const annualIncome = normalizeAnnualIncome(grossIncome, frequency);

	let remaining = annualIncome;
	let totalTax = 0;
	const breakdown = [];

	// 2. Apply PAYE progressive bands
	for (const band of PAYE_TAX_BANDS) {
		if (remaining <= 0) break;

		const taxableAmount = Math.min(remaining, band.limit);
		const taxForBand = taxableAmount * band.rate;

		breakdown.push({
			rate: band.rate,
			taxableAmount,
			tax: Number(taxForBand.toFixed(2)),
		});

		totalTax += taxForBand;
		remaining -= taxableAmount;
	}

	return {
		taxType: "PIT",
		grossIncome,
		frequency,
		annualIncome,
		totalAnnualTax: Number(totalTax.toFixed(2)),
		monthlyTax: Number((totalTax / 12).toFixed(2)),
		breakdown,
	};
};

module.exports = {
	calculatePIT,
};
