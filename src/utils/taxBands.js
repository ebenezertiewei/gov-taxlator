// src/utils/taxBands.js

/**
 * Nigeria PAYE Tax Bands (Annual)
 * Progressive tax system
 */

const PAYE_TAX_BANDS = [
	{
		limit: 800000,
		rate: 0.0, // 0 – 800,000 → 0%
	},
	{
		limit: 2200000, // 800,001 – 3,000,000
		rate: 0.15,
	},
	{
		limit: 9000000, // 3,000,001 – 12,000,000
		rate: 0.18,
	},
	{
		limit: 13000000, // 12,000,001 – 25,000,000
		rate: 0.21,
	},
	{
		limit: 25000000, // 25,000,001 – 50,000,000
		rate: 0.23,
	},
	{
		limit: Infinity, // Above 50,000,000
		rate: 0.25,
	},
];

module.exports = PAYE_TAX_BANDS;