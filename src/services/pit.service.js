const { PAYE_TAX_BANDS } = require("../utils/taxBands");

/**
 * PIT – Annual personal income tax
 */
const calculatePIT = async ({ grossIncome, allowances = 0 }) => {
	// CRA
	const CRA = grossIncome * 0.2 + 200000;

	const taxableIncome = Math.max(grossIncome - CRA - allowances, 0);

	let remaining = taxableIncome;
	let tax = 0;
	const breakdown = [];

	for (const band of PAYE_TAX_BANDS) {
		if (remaining <= 0) break;

		const amount = Math.min(remaining, band.limit);
		const bandTax = amount * band.rate;

		breakdown.push({
			bandLimit: band.limit,
			rate: band.rate,
			taxableAmount: amount,
			tax: Number(bandTax.toFixed(2)),
		});

		tax += bandTax;
		remaining -= amount;
	}

	return {
		grossIncome,
		CRA,
		allowances,
		taxableIncome,
		totalTax: Number(tax.toFixed(2)),
		breakdown,
	};
};

module.exports = {
	calculatePIT,
};
