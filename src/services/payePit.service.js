// src/services/paye.service.js
const PAYE_TAX_BANDS = require("../utils/taxBands");
// -----------------------

/**
 * Calculate PAYE Tax (Nigeria)
 */
exports.calculatePAYE = async ({
	grossIncome,
	otherDeductions = 0,
	includePension = true,
	includeNhf = true,
	includeNhIs = true,
}) => {
	const deductions = {};

	// Fixed statutory deductions
	deductions["Rent Relief Deduction (20%)"] = grossIncome * 0.2;

	if (includePension) deductions["Pension Deduction (8%)"] = grossIncome * 0.08;

	if (includeNhIs)
		deductions["National Health Insurance Scheme Deduction (5%)"] =
			grossIncome * 0.05;

	if (includeNhf)
		deductions["National Housing Fund (2.5%)"] = grossIncome * 0.025;

	if (otherDeductions > 0) deductions["Other Expenses"] = otherDeductions;

	const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0);

	const taxableIncome = grossIncome - totalDeductions;

	// Progressive tax
	const bands = [
		{ limit: 800000, rate: 0 },
		{ limit: 3000000, rate: 0.15 },
		{ limit: 12000000, rate: 0.18 },
		{ limit: 25000000, rate: 0.21 },
		{ limit: 50000000, rate: 0.23 },
		{ limit: Infinity, rate: 0.25 },
	];

	let remaining = taxableIncome;
	let tax = 0;
	const steps = [];

	let lastLimit = 0;
	for (const band of bands) {
		if (remaining <= 0) break;

		const taxableAtBand = Math.min(band.limit - lastLimit, remaining);
		const bandTax = taxableAtBand * band.rate;

		if (taxableAtBand > 0) {
			steps.push({
				label:
					band.rate === 0
						? `First ₦${band.limit.toLocaleString()}`
						: `Tax ${band.rate * 100}% of ₦${taxableAtBand.toLocaleString()}`,
				amount: bandTax,
			});
		}

		tax += bandTax;
		remaining -= taxableAtBand;
		lastLimit = band.limit;
	}

	return {
		grossIncome,
		netIncome: grossIncome - tax,
		totalDeductions,
		deductions,
		taxableIncome,
		totalTax: tax,
		taxBands: [
			{ label: "₦0 - ₦800,000", rate: "0%" },
			{ label: "₦800,001 - ₦3,000,000", rate: "15%" },
			{ label: "₦3,000,001 - ₦12,000,000", rate: "18%" },
			{ label: "₦12,000,001 - ₦25,000,000", rate: "21%" },
			{ label: "₦25,000,001 - ₦50,000,000", rate: "23%" },
			{ label: "Above ₦50,000,000", rate: "25%" },
		],
		computation: steps,
	};
};
