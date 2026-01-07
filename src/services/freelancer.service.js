const { PAYE_TAX_BANDS } = require("../utils/taxBands");

/**
 * Personal Income Tax (PIT) – Nigeria
 */
const calculatePIT = async ({
	grossIncome,
	frequency = "annual",
	expenses = 0,
	pension = false,
}) => {
	// 1. Normalize income to annual
	const annualIncome = frequency === "monthly" ? grossIncome * 12 : grossIncome;

	// 2. Pension deduction (optional – 8%)
	const pensionDeduction = pension ? annualIncome * 0.08 : 0;

	// 3. Net income
	const netIncome = annualIncome - expenses - pensionDeduction;

	// 4. Consolidated Relief Allowance (CRA)
	const CRA = netIncome * 0.2 + 200000;

	// 5. Taxable income
	const taxableIncome = Math.max(netIncome - CRA, 0);

	// 6. Apply progressive tax bands
	let remaining = taxableIncome;
	let totalTax = 0;
	const breakdown = [];

	for (const band of PAYE_TAX_BANDS) {
		if (remaining <= 0) break;

		const taxableAmount = Math.min(remaining, band.limit);
		const taxForBand = taxableAmount * band.rate;

		breakdown.push({
			bandLimit: band.limit,
			rate: band.rate,
			taxableAmount,
			tax: Number(taxForBand.toFixed(2)),
		});

		totalTax += taxForBand;
		remaining -= taxableAmount;
	}

	return {
		grossIncome: annualIncome,
		frequency,
		deductions: {
			expenses,
			pension: pensionDeduction,
			CRA,
		},
		taxableIncome,
		totalAnnualTax: Number(totalTax.toFixed(2)),
		monthlyTax: Number((totalTax / 12).toFixed(2)),
		effectiveTaxRate:
			annualIncome > 0 ? +(totalTax / annualIncome).toFixed(3) : 0,
		breakdown,
	};
};

module.exports = {
	calculatePIT,
};
