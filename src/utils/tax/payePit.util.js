function calculatePAYE({
	grossIncome,
	frequency = "annual",
	pension = true,
	nhis = true,
	nhf = true,
}) {
	// Normalize income
	const annualIncome = frequency === "monthly" ? grossIncome * 12 : grossIncome;

	// Statutory deductions
	const pensionDeduction = pension ? annualIncome * 0.08 : 0;
	const nhisDeduction = nhis ? annualIncome * 0.1 : 0;
	const nhfDeduction = nhf ? annualIncome * 0.025 : 0;

	const statutoryDeductions = pensionDeduction + nhisDeduction + nhfDeduction;

	// Consolidated Relief Allowance
	const CRA = annualIncome * 0.2 + 200000;

	// Taxable income
	const taxableIncome = Math.max(annualIncome - CRA - statutoryDeductions, 0);

	// PAYE tax bands
	const bands = [
		{ limit: 300000, rate: 0.07 },
		{ limit: 300000, rate: 0.11 },
		{ limit: 500000, rate: 0.15 },
		{ limit: 500000, rate: 0.19 },
		{ limit: 1600000, rate: 0.21 },
		{ limit: Infinity, rate: 0.24 },
	];

	let remaining = taxableIncome;
	let tax = 0;

	for (const band of bands) {
		if (remaining <= 0) break;
		const taxableAtBand = Math.min(remaining, band.limit);
		tax += taxableAtBand * band.rate;
		remaining -= taxableAtBand;
	}

	return {
		grossIncome: annualIncome,
		taxableIncome,
		taxAmount: Math.round(tax),
		effectiveTaxRate: annualIncome > 0 ? +(tax / annualIncome).toFixed(3) : 0,
	};
}

module.exports = calculatePAYE;
