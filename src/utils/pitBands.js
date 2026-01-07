/**
 * Nigerian Personal Income Tax Bands (PITA)
 */
const PIT_TAX_BANDS = [
	{ limit: 300000, rate: 0.07 },
	{ limit: 300000, rate: 0.11 },
	{ limit: 500000, rate: 0.15 },
	{ limit: 500000, rate: 0.19 },
	{ limit: 1600000, rate: 0.21 },
	{ limit: Infinity, rate: 0.24 },
];

module.exports = { PIT_TAX_BANDS };
