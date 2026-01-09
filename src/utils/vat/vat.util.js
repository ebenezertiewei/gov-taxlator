/**
 * VAT Utilities
 */

const parseAmount = (amount) => {
	if (typeof amount === "string") {
		return parseFloat(amount.replace(/,/g, ""));
	}
	return amount;
};

/**
 * Calculate VAT
 * @param {number|string} amount - Transaction amount
 * @param {number} rate - VAT rate (0.075 for 7.5%)
 * @param {string} type - "add" or "remove"
 * @returns {number} Resulting amount (rounded to 2dp)
 */
const calculateVAT = ({ amount, rate, type }) => {
	const numericAmount = parseAmount(amount);

	if (isNaN(numericAmount)) {
		throw new Error("Invalid amount");
	}

	let result;

	if (type === "add") {
		// Add VAT to net amount
		result = numericAmount * (1 + rate);
	}

	if (type === "remove") {
		// Amount already has NO VAT → return as-is
		result = numericAmount;
	}

	if (result === undefined) {
		throw new Error("Invalid VAT type, must be 'add' or 'remove'");
	}

	// Round to 2 decimal places
	return Math.round(result * 100) / 100;
};

module.exports = { calculateVAT, parseAmount };
