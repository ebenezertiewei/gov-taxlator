// src/services/vat.service.js

const VAT_RATE = require("../utils/vat");

/**
 * Calculate VAT
 */
exports.calculateVat = async ({ salesAmount, purchaseAmount = 0 }) => {
	if (salesAmount <= 0 && purchaseAmount <= 0) {
		const error = new Error(
			"Sales or purchase amount must be greater than zero"
		);
		error.statusCode = 400;
		throw error;
	}

	const salesVat = salesAmount * VAT_RATE;
	const purchaseVat = purchaseAmount * VAT_RATE;

	return {
		vatRate: VAT_RATE,
		salesAmount,
		purchaseAmount,
		salesVat: Number(salesVat.toFixed(2)),
		purchaseVat: Number(purchaseVat.toFixed(2)),
		netVat: Number((salesVat - purchaseVat).toFixed(2)),
	};
};

/**
 * Reverse VAT calculation
 */
exports.calculateReverseVat = async ({ totalAmount }) => {
	if (totalAmount <= 0) {
		const error = new Error("Total amount must be greater than zero");
		error.statusCode = 400;
		throw error;
	}

	const baseAmount = totalAmount / (1 + VAT_RATE);
	const vatAmount = totalAmount - baseAmount;

	return {
		vatRate: VAT_RATE,
		baseAmount: Number(baseAmount.toFixed(2)),
		vatAmount: Number(vatAmount.toFixed(2)),
		totalAmount: Number(totalAmount.toFixed(2)),
	};
};
